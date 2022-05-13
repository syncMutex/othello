import { useEffect, useRef, useState } from "react";

interface AsyncAbortControlledFunc {
  (c:AbortController): Promise<any>;
}

interface AbortControlledFunc {
  (c:AbortController): void
}

export function useEffectAbortControlled(func: AsyncAbortControlledFunc|AbortControlledFunc, deps:any[]|undefined=undefined) {
  useEffect(() => {
    const controller = new AbortController();
    func(controller);
    return () => controller.abort();
  }, deps)
}

export function useCopyToClipboard(theme:string):[(text: string, msg: string) => void, string|JSX.Element] {
  const [copiedMsg, setCopiedMsg] = useState('');
  const copiedTimeout = useRef(null) as any;

  const copyToClipboard = (text: string, msg: string) => {
    clearTimeout(copiedTimeout.current);
    if (!navigator.clipboard) return;
    else 
      navigator.clipboard.writeText(text)
        .then(() => {
          copiedTimeout.current = setTimeout(() => {
            setCopiedMsg('');
          }, 2000);
          setCopiedMsg(msg);
        })
        .catch((err) => alert(err));
  }

  return [copyToClipboard, copiedMsg === '' ? '' : <div className="copied-msg" data-theme={theme}>{copiedMsg}</div>];
}