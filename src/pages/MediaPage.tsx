import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, FileIcon, Image as ImageIcon, Video, Search, Tag as TagIcon } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { useActiveClub, useClubPermissions } from "@/hooks/useClubs";
import { useClubMedia, useUploadClubMedia, useDeleteClubMedia, getMediaSignedUrl, type ClubMedia } from "@/hooks/useClubMedia";
import { useProfiles } from "@/hooks/useProfiles";

function MediaThumb({ m }: { m: ClubMedia }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (m.mime_type?.startsWith("image/")) {
      getMediaSignedUrl(m.storage_path).then(setUrl).catch(() => {});
    }
  }, [m.storage_path, m.mime_type]);
  if (url) return <img src={url} alt={m.name} loading="lazy" className="w-full h-full object-cover" />;
  const Icon = m.mime_type?.startsWith("video/") ? Video : m.mime_type?.startsWith("image/") ? ImageIcon : FileIcon;
  return <div className="w-full h-full flex items-center justify-center bg-muted"><Icon className="w-8 h-8 text-muted-foreground" /></div>;
}

export default function MediaPage() {
  const { active } = useActiveClub();
  const perms = useClubPermissions(active?.id ?? null);
  const { data: media = [] } = useClubMedia(active?.id ?? null);
  const { data: profiles = {} } = useProfiles(media.map((m) => m.uploaded_by));
  const upload = useUploadClubMedia();
  const del = useDeleteClubMedia();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const allTags = Array.from(new Set(media.flatMap((m) => m.tags))).sort();
  const filtered = media.filter((m) =>
    (!search || m.name.toLowerCase().includes(search.toLowerCase())) &&
    (!tagFilter || m.tags.includes(tagFilter))
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files || !active) return;
    for (const f of Array.from(files)) {
      try { await upload.mutateAsync({ clubId: active.id, file: f }); }
      catch (e: any) { toast.error(`${f.name}: ${e.message}`); }
    }
    toast.success("Uploaded");
  };

  const openSignedUrl = async (m: ClubMedia) => {
    const url = await getMediaSignedUrl(m.storage_path);
    window.open(url, "_blank");
  };

  if (!active) return <PageShell title="Media"><p className="text-sm text-muted-foreground">No club selected.</p></PageShell>;

  return (
    <PageShell title="Media library" subtitle={`Shared media in ${active.name}`}>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {perms.canCreate && (
          <>
            <input ref={fileRef} type="file" multiple className="hidden"
              onChange={(e) => { handleFiles(e.target.files); if (fileRef.current) fileRef.current.value = ""; }} />
            <button onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
              <Upload className="w-4 h-4" /> Upload
            </button>
          </>
        )}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
            className="w-full pl-8 pr-3 h-9 text-sm bg-muted rounded-md outline-none" />
        </div>
        {allTags.length > 0 && (
          <select value={tagFilter ?? ""} onChange={(e) => setTagFilter(e.target.value || null)}
            className="h-9 text-sm bg-muted rounded-md px-2 outline-none">
            <option value="">All tags</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-lg">
          <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No media yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((m) => {
            const p = profiles[m.uploaded_by];
            return (
              <div key={m.id} className="bg-card border border-border rounded-md overflow-hidden group relative">
                <button onClick={() => openSignedUrl(m)} className="block w-full aspect-square overflow-hidden bg-muted">
                  <MediaThumb m={m} />
                </button>
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{p?.display_name ?? ""}</p>
                  {m.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {m.tags.slice(0, 2).map((t) => (
                        <span key={t} className="inline-flex items-center gap-0.5 text-[9px] bg-muted px-1 rounded">
                          <TagIcon className="w-2.5 h-2.5" /> {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {perms.canCreate && (
                  <button onClick={async () => {
                    if (!confirm("Delete this file?")) return;
                    try { await del.mutateAsync(m); toast.success("Deleted"); }
                    catch (e: any) { toast.error(e.message); }
                  }} aria-label="Delete"
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-md bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
