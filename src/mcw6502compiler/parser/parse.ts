import { type Config, makeConfig } from '@/mcw6502compiler/config';
import {
  type ErrorResult,
  makeSuccess,
  type ParseResult,
  type Result,
  ResultKind,
} from '@/mcw6502compiler/parser/parserTypes';
import { type LineContentsNode, type LineNode, NodeKind } from '@/mcw6502compiler/parser/ast';
import { parseComment } from '@/mcw6502compiler/parser/parseComment';
import {
  labelDefinitionRegExp,
  parseLabelDefinition,
} from '@/mcw6502compiler/parser/parseLabelDefinition';
import { parseInstruction } from '@/mcw6502compiler/parser/parseInstruction';
import { emptyRegExp, symbolDefinitionLightRegExp } from '@/mcw6502compiler/parser/regExp';
import { parseDirective } from '@/mcw6502compiler/parser/parseDirective';
import { parseSymbolDefinition } from '@/mcw6502compiler/parser/parseSymbolDefinition';
import { expected, testRegExp } from '@/mcw6502compiler/parser/stringInput';

/**
 * Given a string (a source file) and some config, it will return the ParseResult
 */
export function parseSource(originalSource: string, initialConfig: Config): ParseResult {
  const config = makeConfig(initialConfig);

  const sourceNormalized = originalSource
    .replace('\r\n', '\n')
    .replace('\r', '\n')
    .replace('\t', ' ');
  const lines = sourceNormalized.split('\n');
  const meta = { originalLines: lines };
  // TODO: does it work with different line endings?
  let index = 0;
  const lineNodes: LineNode[] = [];
  let errors: ErrorResult[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      // is it a comment only line
      if (trimmed.startsWith(';')) {
        const commentResult = parseComment({ index, value: line, meta }, config);
        if (commentResult.kind === ResultKind.Error) {
          errors.push(commentResult);
        } else {
          lineNodes.push({
            kind: NodeKind.line,
            range: commentResult.value.range,
            comment: commentResult.value,
          });
        }
      } else {
        let result: Result<LineContentsNode>;
        // is it a label definition
        if (labelDefinitionRegExp.test(trimmed)) {
          result = parseLabelDefinition({ index, value: line, meta }, config);
        } else if (trimmed.startsWith('.')) {
          result = parseDirective({ index, value: line, meta }, config);
        } else if (symbolDefinitionLightRegExp.test(trimmed)) {
          result = parseSymbolDefinition({ index, value: line, meta }, config);
        } else {
          result = parseInstruction({ index, value: line, meta }, config);
        }
        const lineResultWithComment = (function addComment(
          r: Result<LineContentsNode>,
        ): Result<LineNode> {
          if (r.kind === ResultKind.Error) {
            return r;
          }
          let rest = r.rest;

          let commentResult;
          if (rest.value.trim().startsWith(';')) {
            let comment = parseComment(rest, config);
            if (comment.kind === ResultKind.Error) {
              return comment;
            }
            commentResult = comment;
            rest = commentResult.rest;
          }

          // if there's no comment, it should be empty
          if (!commentResult && !testRegExp(rest, emptyRegExp)) {
            return expected(rest, 'End of input');
          }

          return makeSuccess<LineNode>(
            {
              kind: NodeKind.line,
              range: [r.value.range[0], rest.index],
              contents: r.value,
              comment: commentResult?.value,
            },
            rest,
          );
        })(result);
        if (lineResultWithComment.kind === ResultKind.Error) {
          errors.push(lineResultWithComment);
        } else {
          lineNodes.push(lineResultWithComment.value);
        }
      }
    }

    index += line.length + 1;
  }

  return {
    errors,
    program: {
      kind: NodeKind.program,
      lines: lineNodes,
      range:
        lineNodes.length >= 1
          ? [lineNodes[0]!.range[0], lineNodes[lineNodes.length - 1]!.range[1]]
          : [0, sourceNormalized.length],
    },
    originalLines: lines,
  };
}
