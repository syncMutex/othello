package main

import (
	"net/http"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func createLobby(w http.ResponseWriter, r *http.Request) {

}

func createHttpRoutes() http.Handler {
	headersOk := handlers.AllowedHeaders([]string{"Content-Type"})
	originsOk := handlers.AllowedOrigins([]string{"*"})
	methodsOk := handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "PUT", "OPTIONS"})
	mainRouter := mux.NewRouter()
	mainRouter.HandleFunc("/test", createLobby).Methods(http.MethodGet)

	r := mainRouter.PathPrefix("/api").Subrouter()
	r.HandleFunc("/create-lobby", createLobby).Methods(http.MethodPost)
	return handlers.CORS(headersOk, originsOk, methodsOk)(mainRouter)
}
