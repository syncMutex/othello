import { useEffect } from "react";

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