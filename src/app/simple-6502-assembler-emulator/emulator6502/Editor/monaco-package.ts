export type { editor } from 'monaco-editor/esm/vs/editor/editor.api';

export async function loadMonacoPackage() {
  return await import('monaco-editor/esm/vs/editor/editor.api');
}
