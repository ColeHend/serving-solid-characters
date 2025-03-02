import { catchError, tap } from "rxjs";
import HttpClient$ from "../utility/httpClientObs";

export default function useLogin(username: string, password: string) {
  HttpClient$.post<string>("/api/Login", {username, password}).pipe(
    catchError((err, caught)=>{
      console.error("Error: ", err);
      return caught;
    }),
    tap((token) => {HttpClient$.token = token;}),
  ).subscribe();

  return HttpClient$.token;
}