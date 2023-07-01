export function sendParentEvent(event: string, data: any) {
  window.parent.postMessage(JSON.stringify({
    source: 'qrtoolkit',
    event,
    data,
  }), '*')
}
