import { catchError, tap } from "rxjs";
import HttpClient$ from "../utility/tools/httpClientObs";

export default function useRegister(username: string, password: string, moreData: string = "") {
  HttpClient$.post<string>("/api/Register", {username, password, moreData}).pipe(
    catchError((err, caught)=>{
      console.error("Error: ", err);
      return caught;
    }),
    tap((token) => {HttpClient$.token = token;}),
  ).subscribe();

  return HttpClient$.token;
}