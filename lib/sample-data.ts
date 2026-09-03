const SAMPLE_MARKERS = ['alpha', '测试', '演示', '虚构', '样例'];

export function isSampleRecord(...values: Array<string | null | undefined>) {
  const source = values.filter(Boolean).join(' ').toLocaleLowerCase('zh-CN');
  return SAMPLE_MARKERS.some((marker) => source.includes(marker));
}
