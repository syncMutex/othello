import React, { Dispatch, PropsWithChildren, ReactNode, SetStateAction, useState } from "react";

export function useLoadingScreen(placeholder:string, loadingState:boolean=false):[
  React.FC<{ children?:ReactNode }>, Dispatch<SetStateAction<boolean>>, boolean
] {
  const [loading, setIsLoading] = useState<boolean>(loadingState);
  return [
    ({children}:{children?:React.ReactNode}) => (
      loading ? <div className="loading-screen">{placeholder}</div> : <>{children||""}</>
    ),
    setIsLoading,
    loading
  ];
}