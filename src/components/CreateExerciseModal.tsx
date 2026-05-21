import { useEffect, useState } from "react";
import { X, Upload, Image, Video, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { FieldEditor } from "./FieldEditor";
import { FieldDiagram, useCreateExercise, useUpdateExercise } from "@/hooks/useCustomExercises";
import { uploadExerciseMediaSafe, MediaError } from "@/lib/mediaUpload";
import { AgeGroup, ExerciseType, SkillLevel, FieldSize } from "@/data/exercises";
import { useTags, useExerciseTagMap, useSetExerciseTags } from "@/hooks/useTags";
import { useActiveClub } from "@/hooks/useClubs";
import { useLocalDraft, loadDraft, clearDraft } from "@/hooks/useLocalDraft";
import { SaveStatus } from "./SaveStatus";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const ageGroups: AgeGroup[] = ["U6", "U8", "U10", "U12", "U14", "U16", "U18", "Senior"];
const exerciseTypes: ExerciseType[] = ["warm-up", "technique", "passing", "finishing", "game-form", "fitness", "cool-down"];
const skillLevels: SkillLevel[] = ["beginner", "intermediate", "advanced"];
const fieldSizes: FieldSize[] = ["small", "medium", "large", "full"];
const iconOptions = ["⚽", "🏃", "🎯", "🔄", "📐", "🥅", "👟", "♟️", "⚡", "🧤", "🏟️", "🏆", "🎪", "📋", "🧘"];

interface CreateExerciseModalProps {
  onClose: () => void;
  editExercise?: {
    customId: string;
    title: string;
    description: string;
    players: number;
    duration: number;
    ageGroups: AgeGroup[];
    skillLevel: SkillLevel;
    type: ExerciseType;
    fieldSize: FieldSize;
    icon: string;
    fieldDiagram?: FieldDiagram | null;
    previewImageUrl?: string | null;
    videoUrl?: string | null;
  } | null;
}

type DraftShape = {
  title: string; description: string; players: number; duration: number;
  selectedAgeGroups: AgeGroup[]; skillLevel: SkillLevel; exerciseType: ExerciseType;
  fieldSize: FieldSize; icon: string; diagram: FieldDiagram;
  previewImageUrl: string; videoUrl: string; selectedTagIds: string[];
};

export function CreateExerciseModal({ onClose, editExercise }: CreateExerciseModalProps) {
  const { t } = useTranslation();
  const draftKey = `exercise:${editExercise?.customId ?? "new"}`;
  const initial = (() => {
    // Only restore draft when CREATING; for edits, take server values as truth.
    if (!editExercise) return loadDraft<DraftShape>(draftKey);
    return null;
  })();

  const [title, setTitle] = useState(editExercise?.title ?? initial?.title ?? "");
  const [description, setDescription] = useState(editExercise?.description ?? initial?.description ?? "");
  const [players, setPlayers] = useState(editExercise?.players ?? initial?.players ?? 6);
  const [duration, setDuration] = useState(editExercise?.duration ?? initial?.duration ?? 10);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<AgeGroup[]>(editExercise?.ageGroups ?? initial?.selectedAgeGroups ?? ["U12"]);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(editExercise?.skillLevel ?? initial?.skillLevel ?? "beginner");
  const [exerciseType, setExerciseType] = useState<ExerciseType>(editExercise?.type ?? initial?.exerciseType ?? "technique");
  const [fieldSize, setFieldSize] = useState<FieldSize>(editExercise?.fieldSize ?? initial?.fieldSize ?? "medium");
  const [icon, setIcon] = useState(editExercise?.icon ?? initial?.icon ?? "⚽");
  const [diagram, setDiagram] = useState<FieldDiagram>(
    editExercise?.fieldDiagram || initial?.diagram || { elements: [], fieldType: "full" },
  );
  const [previewImageUrl, setPreviewImageUrl] = useState(editExercise?.previewImageUrl ?? initial?.previewImageUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(editExercise?.videoUrl ?? initial?.videoUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "field" | "media">("details");
  const [shareWithClub, setShareWithClub] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initial?.selectedTagIds ?? []);
  const [submitted, setSubmitted] = useState(false);

  const { data: tags = [] } = useTags();
  const { data: tagMap = {} } = useExerciseTagMap();
  const setExerciseTags = useSetExerciseTags();
  const { active: activeClub } = useActiveClub();

  // Persist draft for new exercises so refresh doesn't lose work
  const draftValue: DraftShape = {
    title, description, players, duration, selectedAgeGroups, skillLevel,
    exerciseType, fieldSize, icon, diagram, previewImageUrl, videoUrl, selectedTagIds,
  };
  const draftStatus = useLocalDraft(draftKey, draftValue, !editExercise && !submitted);

  useEffect(() => {
    if (editExercise?.customId && tagMap[editExercise.customId]) {
      setSelectedTagIds(tagMap[editExercise.customId]);
    }
  }, [editExercise?.customId, tagMap]);

  const createExercise = useCreateExercise();
  const updateExercise = useUpdateExercise();

  const toggleAgeGroup = (ag: AgeGroup) => {
    setSelectedAgeGroups((prev) =>
      prev.includes(ag) ? prev.filter((x) => x !== ag) : [...prev, ag]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadExerciseMediaSafe(file, editExercise?.customId || "new", "image");
      setPreviewImageUrl(url);
      toast.success(t("exercise.imageUploaded"));
    } catch (err) {
      toast.error(err instanceof MediaError ? err.message : t("exercise.uploadFailed"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadExerciseMediaSafe(file, editExercise?.customId || "new", "video");
      setVideoUrl(url);
      toast.success(t("exercise.videoUploaded"));
    } catch (err) {
      toast.error(err instanceof MediaError ? err.message : t("exercise.uploadFailed"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(t("exercise.titleRequired"));
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      players,
      duration,
      age_groups: selectedAgeGroups,
      skill_level: skillLevel,
      exercise_type: exerciseType,
      field_size: fieldSize,
      icon,
      field_diagram: diagram.elements.length > 0 ? diagram : undefined,
      preview_image_url: previewImageUrl || undefined,
      video_url: videoUrl || undefined,
      club_id: shareWithClub && activeClub && !activeClub.is_personal ? activeClub.id : null,
      is_public: isPublic,
    };

    try {
      let exerciseId = editExercise?.customId;
      if (editExercise?.customId) {
        await updateExercise.mutateAsync({ id: editExercise.customId, ...payload });
        toast.success(t("exercise.updated"));
      } else {
        const created: any = await createExercise.mutateAsync(payload);
        exerciseId = created?.id;
        toast.success(t("exercise.saved"));
      }
      if (exerciseId) {
        await setExerciseTags.mutateAsync({ exerciseId, tagIds: selectedTagIds });
      }
      setSubmitted(true);
      clearDraft(draftKey);
      onClose();
    } catch (err) {
      toast.error(t("exercise.saveFailed"));
    }
  };

  const isSaving = createExercise.isPending || updateExercise.isPending;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "tween", ease: [0.2, 0, 0, 1], duration: 0.25 }}
        className="bg-background rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground tracking-tight">
              {editExercise ? t("exercise.edit") : t("exercise.create")}
            </h2>
            {!editExercise && <SaveStatus status={draftStatus} />}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-sm flex items-center justify-center hover:bg-muted transition-colors" aria-label={t("common.close")}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          {(["details", "field", "media"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`exercise.tabs.${tab}`)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "details" && (
            <div className="space-y-4">
              {/* Icon */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">{t("exercise.icon")}</label>
                <div className="flex flex-wrap gap-1.5">
                  {iconOptions.map((ic) => (
                    <button
                      key={ic}
                      onClick={() => setIcon(ic)}
                      className={`w-9 h-9 rounded-sm flex items-center justify-center text-lg transition-all ${
                        icon === ic ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">{t("exercise.title")} *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("exercise.namePlaceholder")}
                  className="w-full px-3 py-2 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">{t("exercise.description")}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("exercise.descPlaceholder")}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-muted rounded-md border-0 outline-none resize-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                />
              </div>

              {/* Players & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">{t("exercise.players")}</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={players}
                    onChange={(e) => setPlayers(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">{t("exercise.duration")}</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  />
                </div>
              </div>

              {/* Type & Skill & Field */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">{t("exercise.type")}</label>
                  <select
                    value={exerciseType}
                    onChange={(e) => setExerciseType(e.target.value as ExerciseType)}
                    className="w-full px-3 py-2 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {exerciseTypes.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">{t("exercise.skill")}</label>
                  <select
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                    className="w-full px-3 py-2 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {skillLevels.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">{t("exercise.field")}</label>
                  <select
                    value={fieldSize}
                    onChange={(e) => setFieldSize(e.target.value as FieldSize)}
                    className="w-full px-3 py-2 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {fieldSizes.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {/* Age Groups */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">{t("exercise.ageGroups")}</label>
                <div className="flex flex-wrap gap-1.5">
                  {ageGroups.map((ag) => (
                    <button
                      key={ag}
                      onClick={() => toggleAgeGroup(ag)}
                      className={`text-xs font-medium px-2.5 py-1.5 rounded-sm transition-all ${
                        selectedAgeGroups.includes(ag)
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {ag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">{t("exercise.tags")}</label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTagIds((ids) => ids.includes(tag.id) ? ids.filter((x) => x !== tag.id) : [...ids, tag.id])}
                      className={`text-xs px-2.5 py-1.5 rounded-sm transition-all ${
                        selectedTagIds.includes(tag.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sharing */}
              <div className="space-y-2 pt-3 border-t border-border">
                {activeClub && !activeClub.is_personal && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={shareWithClub} onChange={(e) => setShareWithClub(e.target.checked)} />
                    {t("exercise.shareWithClub")} <span className="font-medium">{activeClub.name}</span>
                  </label>
                )}
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                  <Globe className="w-3.5 h-3.5" /> {t("exercise.publishCommunity")}
                </label>
              </div>
            </div>
          )}

          {activeTab === "field" && (
            <FieldEditor diagram={diagram} onChange={setDiagram} />
          )}

          {activeTab === "media" && (
            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5" /> {t("exercise.fieldDiagram")}
                </label>
                {previewImageUrl ? (
                  <div className="relative rounded-md overflow-hidden border border-border">
                    <img src={previewImageUrl} alt="Preview" className="w-full aspect-[4/3] object-cover" />
                    <button
                      onClick={() => setPreviewImageUrl("")}
                      className="absolute top-2 right-2 w-7 h-7 rounded-sm bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 rounded-md border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">{t("exercise.uploadImage")}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>

              {/* Video Upload */}
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" /> {t("exercise.videoUrl")}
                </label>
                {videoUrl ? (
                  <div className="relative rounded-md overflow-hidden border border-border">
                    <video src={videoUrl} controls className="w-full" preload="metadata" />
                    <button
                      onClick={() => setVideoUrl("")}
                      className="absolute top-2 right-2 w-7 h-7 rounded-sm bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 rounded-md border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">{t("exercise.uploadVideo")}</span>
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim() || uploading}
            className="px-5 py-2 rounded-sm bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? t("exercise.uploading") : editExercise ? t("common.edit") : t("exercise.create")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
