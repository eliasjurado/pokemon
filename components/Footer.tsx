import { AUTHOR_URL, REPO_URL } from "@/lib/site";
import { GithubIcon, HeartIcon } from "./Icons";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border px-4 py-8 pb-28 text-center text-sm text-muted-foreground">
      <p className="inline-flex flex-wrap items-center justify-center gap-x-1.5">
        Con <HeartIcon className="size-4 text-[#ff6b81]" />
        <span className="sr-only">amor</span> para mis hijos por{" "}
        <a href={AUTHOR_URL} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center font-bold text-accent underline-offset-4 hover:underline">
          Elías Jurado
        </a>
      </p>
      <p className="mt-1">
        <a href={REPO_URL} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-2 px-2 hover:text-foreground">
          <GithubIcon className="size-4" /> Ver en GitHub
        </a>
      </p>
      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed">Proyecto familiar sin fines de lucro. Pokémon es marca de Nintendo, Game Freak y The Pokémon Company.</p>
    </footer>
  );
}
