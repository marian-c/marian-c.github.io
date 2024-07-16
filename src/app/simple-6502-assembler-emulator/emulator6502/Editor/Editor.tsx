import React from 'react';
import MonacoEditor, { loader } from '@monaco-editor/react';
import { View } from '@/components/view/view';
import { localStorageSimpleGet, localStorageSimpleSet } from '@/helpers/window/localStorageSimple';
import type { ErrorResult } from '@/mcw6502compiler/parser/parserTypes';
import { Button } from '@/components/Button/Button';
import { textLinkCN } from '@/app/classnames';
import {
  loadMonacoPackage,
  type editor,
} from '@/app/simple-6502-assembler-emulator/emulator6502/Editor/monaco-package';
import { assertIsDefined } from '@/utils';
import { defaultSourceCode } from '@/app/simple-6502-assembler-emulator/emulator6502/utils';

const localstorageKey = 'simple-6502-editor-code';

export type EditorHandleRef = {
  getSourceString: () => string;
  setCompilationErrors: (newCompilationErrors: ErrorResult[]) => void;
};

export const Editor: React.FunctionComponent<{
  onChange: () => void;
  handleRef: React.RefObject<EditorHandleRef>;
}> = ({ onChange, handleRef }) => {
  const monacoEditorRef = React.useRef<editor.IStandaloneCodeEditor>();
  const [compilationErrors, setCompilationErrors] = React.useState<ErrorResult[]>([]);
  const [currentErrorIdx, setCurrentErrorIdx] = React.useState(0);
  // everytime the errors array changes, reset the current error index
  // TODO: this can be throttled, but dont forget to flush when fetching it from the imperative handle
  React.useImperativeHandle(
    handleRef,
    () => {
      return {
        setCompilationErrors(newCompilationErrors) {
          setCompilationErrors(newCompilationErrors);
          setCurrentErrorIdx(0);
        },
        getSourceString() {
          return localStorageSimpleGet(localstorageKey) || '';
        },
      };
    },
    [],
  );
  const [initialValue, setInitialValue] = React.useState<string | null>(null);
  React.useEffect(() => {
    (async () => {
      // full fledged vesion but can not be loaded in a worker
      // const monaco = await import('monaco-editor');
      // or slimmed down version (:shrug:) - does not have commands (actions)
      const monaco = await loadMonacoPackage();

      loader.config({ monaco });

      // https://ohdarling88.medium.com/4-steps-to-add-custom-language-support-to-monaco-editor-5075eafa156d
      monaco.languages.register({ id: 'mcw6502' });
      // TODO: get the list from the actual emulator or something
      const languageKeywords = ['STA', 'LDA'];
      monaco.languages.setMonarchTokensProvider('mcw6502', {
        keywords: languageKeywords,
        tokenizer: {
          root: [
            [
              /@?[a-zA-Z][\w$]*/,
              {
                cases: {
                  '@keywords': 'keyword',
                  '@default': 'variable',
                },
              },
            ],
            [/".*?"/, 'string'],
            [/\/\//, 'comment'],
          ],
        },
      });

      // TODO: error handling
      await loader.init();
      setInitialValue(localStorageSimpleGet(localstorageKey) || defaultSourceCode);
    })();
  }, []);
  return (
    <View grow>
      <View grow className="overflow-hidden min-h-[200px] min-w-[400px] flex-1">
        <div className="h-full w-full relative">
          <div className="h-full w-full absolute">
            {initialValue !== null && (
              <MonacoEditor
                key={initialValue === null ? 'no-loaded' : 'loaded'}
                defaultValue={initialValue ?? ''}
                onChange={(newValue) => {
                  localStorageSimpleSet(localstorageKey, newValue || '');
                  onChange();
                }}
                height="100%"
                loading="Loading editor scripts"
                language="mcw6502"
                options={{ automaticLayout: true, language: 'mcw6502', wordWrap: 'on' }}
                onMount={(editorInstance) => {
                  monacoEditorRef.current = editorInstance;
                }}
              />
            )}
          </div>
        </div>
      </View>
      {compilationErrors.length !== 0 && (
        <View
          horizontal
          className="items-end border border-red-500 p-1 max-h-[200px] overflow-auto"
        >
          <View grow>
            <div>
              Error at{' '}
              <span
                className={textLinkCN}
                onClick={() => {
                  const monacoEditor = monacoEditorRef.current;
                  assertIsDefined(monacoEditor);
                  monacoEditor.setPosition({
                    lineNumber: compilationErrors[currentErrorIdx]!.lineRange.start[0],
                    column: compilationErrors[currentErrorIdx]!.lineRange.start[1],
                  });
                  monacoEditor.revealLine(compilationErrors[currentErrorIdx]!.lineRange.start[0]);
                  monacoEditor.focus();
                }}
              >
                {compilationErrors[currentErrorIdx]!.lineRange.start[0]}:
                {compilationErrors[currentErrorIdx]!.lineRange.start[1]}
              </span>
              <p>{compilationErrors[currentErrorIdx]!.message}</p>
            </div>
          </View>
          <View>
            <div style={{ textAlign: 'right' }}>
              {currentErrorIdx + 1} / {compilationErrors.length}
            </div>
            {compilationErrors.length !== 1 && (
              <div>
                <Button
                  disabled={currentErrorIdx === 0}
                  onClick={() => {
                    setCurrentErrorIdx(currentErrorIdx - 1);
                  }}
                >
                  &lt;
                </Button>
                <Button
                  disabled={currentErrorIdx === compilationErrors.length - 1}
                  onClick={() => {
                    setCurrentErrorIdx(currentErrorIdx + 1);
                  }}
                >
                  &gt;
                </Button>
              </div>
            )}
          </View>
        </View>
      )}
    </View>
  );
};
