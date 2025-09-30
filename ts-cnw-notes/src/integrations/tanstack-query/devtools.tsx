import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function Devtools() {
  return <ReactQueryDevtools initialIsOpen={false} />;
}
