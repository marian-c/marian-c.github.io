export function mergeClassNameFirstPriority(props: Record<string, any>, className: string) {
  // props['className'] = className + ' ' + (props['className'] || '') ;
  // return props;
  return {
    ...props,
    className: className + ' ' + (props['className'] || ''),
  };
}
