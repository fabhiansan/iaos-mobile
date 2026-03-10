import { Calendar } from "lucide-react";
import { Badge } from "./badge";
import type { Article } from "./featured-carousel";

interface ArticleCardProps {
  article: Article;
  onClick?: (id: string) => void;
}

export function ArticleCard({ article, onClick }: ArticleCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(article.id)}
      className="flex items-start w-full bg-white border border-neutral-100 rounded-lg overflow-hidden p-px text-left cursor-pointer"
    >
      <div className="shrink-0 w-[128px] h-[140px] overflow-hidden">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-1 p-2 flex-1 min-w-0">
        <Badge
          label={article.category}
          variant={article.category === "Announcement" ? "primary" : "secondary"}
        />
        <h4 className="font-[family-name:var(--font-work-sans)] text-sm font-medium leading-5 text-neutral-800 line-clamp-2">
          {article.title}
        </h4>
        <p className="font-[family-name:var(--font-work-sans)] text-[10px] text-neutral-500 leading-4 line-clamp-2">
          {article.summary}
        </p>
        <div className="flex items-center gap-2">
          <Calendar size={12} className="text-neutral-600" />
          <span className="font-[family-name:var(--font-work-sans)] text-[10px] text-neutral-600 leading-4">
            {article.timestamp}
          </span>
        </div>
      </div>
    </button>
  );
}
