package respond

import (
	"encoding/json"
	"net/http"
)

type ResponseStruct struct {
	Err bool   `json:"err"`
	Msg string `json:"msg"`
}

func RespondErrMsg(msg string, w http.ResponseWriter) {
	res := ResponseStruct{Msg: msg, Err: true}
	json.NewEncoder(w).Encode(res)
}

func RespondSuccess(w http.ResponseWriter) {
	json.NewEncoder(w).Encode(ResponseStruct{Err: false, Msg: "success"})
}
