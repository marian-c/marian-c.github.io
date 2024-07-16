// TODO: get hints from https://github.com/suren-atoyan/monaco-react/blob/master/src/Editor/Editor.tsx

import type { EmulationDriver6502 } from '@/app/simple-6502-assembler-emulator/emulator6502/types';
import React from 'react';
import { useElementLayout } from '@/hooks/useElementLayout/useElementLayout';
import type { editor as MonacoEditor } from 'monaco-editor';
import { View } from '@/components/view/view';
type Monaco = typeof import('monaco-editor');
let monacoCache: Monaco | null = null;

export const EditorInner: React.FunctionComponent<{ monaco: Monaco }> = ({ monaco }) => {
  const editorDivRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<MonacoEditor.IStandaloneCodeEditor>();
  const containerRef = React.useRef<HTMLDivElement>(null);

  useElementLayout(editorDivRef, () => {
    // TODO: try the automaticLayout option on the editor
    editorRef.current?.layout();
  });
  React.useEffect(() => {
    const editor = monaco.editor.create(editorDivRef.current!, { language: 'mcw6502' });
    editorRef.current = editor;

    console.log('MODEL?', editor.getModel());

    return () => {
      editor.dispose();
    };
  }, [monaco.editor]);

  return (
    <View grow>
      <div className="border-b border-b-neutral-500 pl-[1px]">HEADER</div>
      <View
        grow
        containerRef={containerRef}
        className="overflow-hidden min-h-[200px] min-w-[400px] flex-1"
      >
        <div className="h-full w-full relative">
          <div className="h-full w-full absolute" ref={editorDivRef} />
        </div>
      </View>
    </View>
  );
};

export const EditorOld: React.FunctionComponent<{
  _driver: EmulationDriver6502;
  stateSignal: number;
}> = () => {
  // TODO: avoid double rendering for subsequent mounts, 'monaco-editor' can be stored at the top level
  const [hasLoaded, setHasLoaded] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      monacoCache = await import('monaco-editor');
      // setup language
      // https://ohdarling88.medium.com/4-steps-to-add-custom-language-support-to-monaco-editor-5075eafa156d
      monacoCache.languages.register({ id: 'mcw6502' });
      // TODO: get the list from the actual emulator or something
      const languageKeywords = ['STA', 'LDA'];
      monacoCache.languages.setMonarchTokensProvider('mcw6502', {
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

      // loaded and configured
      setHasLoaded(true);
    })();
  }, []);
  if (hasLoaded) {
    return <EditorInner monaco={monacoCache!} />;
  }
  return <div>Loading editor scripts.. </div>;
};
