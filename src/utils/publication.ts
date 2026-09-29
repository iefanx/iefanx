/** Keep reading estimates consistent across the cover, indexes, and article pages. */
export function readingMinutes(body: string): number {
  const prose = body.replace(/```[\s\S]*?```/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]+>/g, ' ').replace(/[#*_`>|]/g, ' ');
  return Math.max(1, Math.ceil(prose.trim().split(/\s+/).filter(Boolean).length / 220));
}
