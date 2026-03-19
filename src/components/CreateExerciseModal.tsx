import { useState } from "react";
import { X, Upload, Image, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FieldEditor } from "./FieldEditor";
import { FieldDiagram, useCreateExercise, useUpdateExercise, uploadExerciseMedia } from "@/hooks/useCustomExercises";
import { AgeGroup, ExerciseType, SkillLevel, FieldSize } from "@/data/exercises";
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

export function CreateExerciseModal({ onClose, editExercise }: CreateExerciseModalProps) {
  const [title, setTitle] = useState(editExercise?.title || "");
  const [description, setDescription] = useState(editExercise?.description || "");
  const [players, setPlayers] = useState(editExercise?.players || 6);
  const [duration, setDuration] = useState(editExercise?.duration || 10);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<AgeGroup[]>(editExercise?.ageGroups || ["U12"]);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(editExercise?.skillLevel || "beginner");
  const [exerciseType, setExerciseType] = useState<ExerciseType>(editExercise?.type || "technique");
  const [fieldSize, setFieldSize] = useState<FieldSize>(editExercise?.fieldSize || "medium");
  const [icon, setIcon] = useState(editExercise?.icon || "⚽");
  const [diagram, setDiagram] = useState<FieldDiagram>(
    editExercise?.fieldDiagram || { elements: [], fieldType: "full" }
  );
  const [previewImageUrl, setPreviewImageUrl] = useState(editExercise?.previewImageUrl || "");
  const [videoUrl, setVideoUrl] = useState(editExercise?.videoUrl || "");
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "field" | "media">("details");

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
      const url = await uploadExerciseMedia(file, editExercise?.customId || "new");
      setPreviewImageUrl(url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video must be under 50MB");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadExerciseMedia(file, editExercise?.customId || "new");
      setVideoUrl(url);
      toast.success("Video uploaded");
    } catch (err) {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
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
    };

    try {
      if (editExercise?.customId) {
        await updateExercise.mutateAsync({ id: editExercise.customId, ...payload });
        toast.success("Exercise updated");
      } else {
        await createExercise.mutateAsync(payload);
        toast.success("Exercise created");
      }
      onClose();
    } catch (err) {
      toast.error("Failed to save exercise");
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
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            {editExercise ? "Edit Exercise" : "Create Exercise"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-sm flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          {(["details", "field", "media"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2.5 text-sm font-medium transition-all capitalize ${
                activeTab === t
                  ? "text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "field" ? "Field Editor" : t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "details" && (
            <div className="space-y-4">
              {/* Icon */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Icon</label>
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
                <label className="text-xs font-medium text-foreground mb-1.5 block">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Exercise name..."
                  className="w-full px-3 py-2 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the exercise..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-muted rounded-md border-0 outline-none resize-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                />
              </div>

              {/* Players & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Players</label>
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
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Duration (min)</label>
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
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Type</label>
                  <select
                    value={exerciseType}
                    onChange={(e) => setExerciseType(e.target.value as ExerciseType)}
                    className="w-full px-3 py-2 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {exerciseTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Skill</label>
                  <select
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                    className="w-full px-3 py-2 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {skillLevels.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Field</label>
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
                <label className="text-xs font-medium text-foreground mb-1.5 block">Age Groups</label>
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
                  <Image className="w-3.5 h-3.5" /> Field Diagram Image
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
                    <span className="text-sm text-muted-foreground">Click to upload image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>

              {/* Video Upload */}
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" /> Video Demonstration
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
                    <span className="text-sm text-muted-foreground">Click to upload video (max 50MB)</span>
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
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim() || uploading}
            className="px-5 py-2 rounded-sm bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : editExercise ? "Update" : "Create Exercise"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
