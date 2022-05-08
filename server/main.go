package main

import (
	"log"
	"net/http"
)

func main() {
	r := createHttpRoutes()
	log.Println("running on http://localhost:5000")
	if err := http.ListenAndServe(":5000", r); err != nil {
		log.Fatal(err.Error())
	}
}
