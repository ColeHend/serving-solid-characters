/* eslint-disable @typescript-eslint/no-explicit-any */
import { isDev } from "solid-js/web";

export class DebugConsole {
  public static log(...data: any[]) {
    if (isDev) {
      console.log(...data);
    }
  }

  public static error(...data: any[]) {
    if (isDev) {
      console.error(...data);
    }
  }

  public static warn(...data: any[]) {
    if (isDev) {
      console.warn(...data);
    }
  }

  public static info(...data: any[]) {
    if (isDev) {
      console.info(...data);
    }
  }

  public static debug(...data: any[]) {
    if (isDev) {
      console.debug(...data);
    }
  }

  public static trace(...data: any[]) {
    if (isDev) {
      console.trace(...data);
    }
  }

  public static table(...data: any[]) {
    if (isDev) {
      console.table(...data);
    }
  }
}