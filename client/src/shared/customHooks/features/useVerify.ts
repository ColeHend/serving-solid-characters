import { catchError, tap } from "rxjs";
import HttpClient$ from "../utility/httpClientObs";
import { createSignal } from "solid-js";

const [success, setSuccess] = createSignal<User | null>(null);

export interface HttpData {
    data: string;
}

export interface User {
    id: number;         
    username: string;      
    password?: string;      
    passHash?: Uint8Array;     
    passSalt?: Uint8Array;      
    moreData?: string;         
}

export default function useVerify() {

  HttpClient$.post<HttpData>("/api/Verify", {}).pipe(
    catchError((err, caught)=>{
      console.error("Error: ", err);
      return caught;
    }),
    tap((data) => {
      const user: User = JSON.parse(data.data);
      if (user.username) {
        setSuccess(user);
      } else {
        setSuccess(user);
      }
    }),

  ).subscribe();

  return success;
}