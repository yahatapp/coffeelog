import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Sliders, Loader2, Pencil, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

interface Grinder {
  id: string;
  name: string;
  fineMax: number;
  mediumFineMax: number;
  mediumMax: number;
  mediumCoarseMax: number;
  isDefault: boolean;
}

const Grinders = () => {
  const navigate = useNavigate();
  const [grinders, setGrinders] = useState<Grinder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Input states
  const [newGrinderName, setNewGrinderName] = useState("");
  const [grinderThresholds, setGrinderThresholds] = useState({
    fineMax: 6 as number | "",
    mediumFineMax: 9 as number | "",
    mediumMax: 15 as number | "",
    mediumCoarseMax: 22 as number | "",
  });

  const fetchGrinders = async () => {
    try {
      const res = await api.api.grinders.$get();
      if (res.ok) {
        setGrinders(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch grinders", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchGrinders();
  }, []);

  const handleStartEdit = (grinder: Grinder) => {
    setEditingId(grinder.id);
    setNewGrinderName(grinder.name);
    setGrinderThresholds({
      fineMax: grinder.fineMax,
      mediumFineMax: grinder.mediumFineMax,
      mediumMax: grinder.mediumMax,
      mediumCoarseMax: grinder.mediumCoarseMax,
    });
    setIsDefault(grinder.isDefault);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewGrinderName("");
    setGrinderThresholds({
      fineMax: 6,
      mediumFineMax: 9,
      mediumMax: 15,
      mediumCoarseMax: 22,
    });
    setIsDefault(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrinderName.trim() || isSubmitting) return;

    // Validation: thresholds must be strictly increasing and not empty
    const { fineMax, mediumFineMax, mediumMax, mediumCoarseMax } = grinderThresholds;
    if (fineMax === "" || mediumFineMax === "" || mediumMax === "" || mediumCoarseMax === "") {
      alert("すべての境界値（クリック数上限）を入力してください。");
      return;
    }
    if (fineMax >= mediumFineMax || mediumFineMax >= mediumMax || mediumMax >= mediumCoarseMax) {
      alert(
        "挽き目の範囲設定は「細挽き < 中細挽き < 中挽き < 中粗挽き」の順に大きくする必要があります。",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Edit mode (PATCH)
        const res = await api.api.grinders[":id"].$patch({
          param: { id: editingId },
          json: {
            name: newGrinderName.trim(),
            fineMax: Number(fineMax),
            mediumFineMax: Number(mediumFineMax),
            mediumMax: Number(mediumMax),
            mediumCoarseMax: Number(mediumCoarseMax),
            isDefault,
          },
        });

        if (res.ok) {
          handleCancelEdit();
          await fetchGrinders();
        }
      } else {
        // Add mode (POST)
        const res = await api.api.grinders.$post({
          json: {
            name: newGrinderName.trim(),
            fineMax: Number(fineMax),
            mediumFineMax: Number(mediumFineMax),
            mediumMax: Number(mediumMax),
            mediumCoarseMax: Number(mediumCoarseMax),
            isDefault,
          },
        });

        if (res.ok) {
          setNewGrinderName("");
          setIsDefault(false);
          setGrinderThresholds({
            fineMax: 6,
            mediumFineMax: 9,
            mediumMax: 15,
            mediumCoarseMax: 22,
          });
          await fetchGrinders();
        }
      }
    } catch (err) {
      console.error(editingId ? "Failed to update grinder" : "Failed to add grinder", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await api.api.grinders[":id"].$patch({
        param: { id },
        json: { isDefault: true },
      });
      if (res.ok) {
        await fetchGrinders();
      }
    } catch (err) {
      console.error("Failed to set default grinder", err);
    }
  };

  const handleDeleteGrinder = async (id: string) => {
    if (!confirm("このグラインダーを削除しますか？")) return;

    try {
      const res = await api.api.grinders[":id"].$delete({
        param: { id },
      });

      if (res.ok) {
        await fetchGrinders();
      }
    } catch (err) {
      console.error("Failed to delete grinder", err);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-12">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold text-coffee-primary">グラインダー管理</h2>
      </div>

      {/* Add/Edit Grinder form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-3 bg-white p-4 rounded-2xl border border-coffee-secondary/15 shadow-sm"
      >
        <div className="flex justify-between items-center pb-1 border-b border-coffee-secondary/10 mb-2">
          <span className="text-xs font-bold text-coffee-primary">
            {editingId ? "グラインダーの設定を編集" : "新規グラインダー登録"}
          </span>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-[10px] text-coffee-secondary hover:text-coffee-primary underline"
            >
              キャンセル
            </button>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="grinderName" className="font-bold text-xs text-coffee-secondary">
            グラインダー名
          </Label>
          <Input
            id="grinderName"
            placeholder="例: コマンダンテ C40、タイムモア C3"
            value={newGrinderName}
            onChange={(e) => setNewGrinderName(e.target.value)}
            className="rounded-xl border-coffee-secondary/20"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Threshold limits setters */}
        <div className="space-y-2 pt-1 border-t border-coffee-secondary/10">
          <Label className="font-bold text-xs text-coffee-secondary flex items-center">
            <Sliders size={12} className="mr-1" />
            挽き目段階の境界値（クリック数上限）
          </Label>
          <p className="text-[10px] text-coffee-secondary/70">
            それぞれの挽き目の最大クリック数を設定します。
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="space-y-1">
              <Label htmlFor="fine" className="text-[11px] text-coffee-secondary font-medium">
                細挽き上限 (Clicks)
              </Label>
              <Input
                id="fine"
                type="number"
                min="1"
                max="40"
                value={grinderThresholds.fineMax}
                onChange={(e) => {
                  const val = e.target.value;
                  setGrinderThresholds({
                    ...grinderThresholds,
                    fineMax: val === "" ? "" : isNaN(parseInt(val)) ? "" : parseInt(val),
                  });
                }}
                className="rounded-xl h-8 border-coffee-secondary/20"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="medFine" className="text-[11px] text-coffee-secondary font-medium">
                中細挽き上限 (Clicks)
              </Label>
              <Input
                id="medFine"
                type="number"
                min="1"
                max="40"
                value={grinderThresholds.mediumFineMax}
                onChange={(e) => {
                  const val = e.target.value;
                  setGrinderThresholds({
                    ...grinderThresholds,
                    mediumFineMax: val === "" ? "" : isNaN(parseInt(val)) ? "" : parseInt(val),
                  });
                }}
                className="rounded-xl h-8 border-coffee-secondary/20"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="medium" className="text-[11px] text-coffee-secondary font-medium">
                中挽き上限 (Clicks)
              </Label>
              <Input
                id="medium"
                type="number"
                min="1"
                max="40"
                value={grinderThresholds.mediumMax}
                onChange={(e) => {
                  const val = e.target.value;
                  setGrinderThresholds({
                    ...grinderThresholds,
                    mediumMax: val === "" ? "" : isNaN(parseInt(val)) ? "" : parseInt(val),
                  });
                }}
                className="rounded-xl h-8 border-coffee-secondary/20"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="medCoarse" className="text-[11px] text-coffee-secondary font-medium">
                中粗挽き上限 (Clicks)
              </Label>
              <Input
                id="medCoarse"
                type="number"
                min="1"
                max="40"
                value={grinderThresholds.mediumCoarseMax}
                onChange={(e) => {
                  const val = e.target.value;
                  setGrinderThresholds({
                    ...grinderThresholds,
                    mediumCoarseMax: val === "" ? "" : isNaN(parseInt(val)) ? "" : parseInt(val),
                  });
                }}
                className="rounded-xl h-8 border-coffee-secondary/20"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>
          <div className="text-[10px] text-coffee-secondary/60 bg-coffee-background p-2 rounded-xl border border-coffee-secondary/5 mt-1.5 leading-relaxed">
            挽き目レンジ of 目安:
            <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
              <li>細挽き: ~{grinderThresholds.fineMax || 0}</li>
              <li>
                中細挽き: {(Number(grinderThresholds.fineMax) || 0) + 1}~
                {grinderThresholds.mediumFineMax || 0}
              </li>
              <li>
                中挽き: {(Number(grinderThresholds.mediumFineMax) || 0) + 1}~
                {grinderThresholds.mediumMax || 0}
              </li>
              <li>
                中粗挽き: {(Number(grinderThresholds.mediumMax) || 0) + 1}~
                {grinderThresholds.mediumCoarseMax || 0}
              </li>
              <li>粗挽き: {(Number(grinderThresholds.mediumCoarseMax) || 0) + 1}+</li>
            </ul>
          </div>
        </div>
        <div className="flex items-center space-x-2 pt-1 pb-2">
          <input
            type="checkbox"
            id="isDefaultGrinder"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="rounded border-coffee-secondary/30 text-coffee-primary focus:ring-coffee-primary/50 w-4 h-4 cursor-pointer"
          />
          <label
            htmlFor="isDefaultGrinder"
            className="text-xs font-medium text-coffee-text cursor-pointer select-none"
          >
            このグラインダーをデフォルトに設定する
          </label>
        </div>

        <div className="flex gap-2">
          {editingId && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-coffee-secondary/20 text-coffee-secondary mt-2 h-9 text-xs"
            >
              キャンセル
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className={`rounded-xl bg-coffee-primary hover:bg-coffee-primary/90 mt-2 h-9 text-xs ${
              editingId ? "flex-1" : "w-full"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin mr-1" size={14} />
            ) : editingId ? (
              <Pencil size={14} className="mr-1" />
            ) : (
              <Plus size={14} className="mr-1" />
            )}
            {editingId ? "変更を保存" : "グラインダーを登録"}
          </Button>
        </div>
      </form>

      {/* Grinder List */}
      {isLoading ? (
        <div className="h-20 w-full animate-pulse bg-coffee-secondary/10 rounded-xl" />
      ) : grinders.length === 0 ? (
        <div className="text-center py-8 bg-coffee-secondary/5 rounded-2xl border border-dashed border-coffee-secondary/15 text-xs text-coffee-secondary">
          登録されているグラインダーはありません。
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-coffee-secondary/10">
            {grinders.map((grinder) => (
              <div
                key={grinder.id}
                className={`p-4 space-y-2 hover:bg-coffee-secondary/5 transition-colors ${
                  editingId === grinder.id
                    ? "bg-coffee-secondary/5 border-l-2 border-coffee-primary"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleSetDefault(grinder.id)}
                      className={`p-1 rounded-full transition-colors ${
                        grinder.isDefault
                          ? "text-coffee-primary"
                          : "text-coffee-secondary/30 hover:text-coffee-primary hover:bg-coffee-secondary/5"
                      }`}
                      title={grinder.isDefault ? "デフォルト" : "デフォルトに設定"}
                      disabled={editingId !== null}
                    >
                      <CheckCircle
                        size={18}
                        className={grinder.isDefault ? "fill-coffee-primary text-white" : ""}
                      />
                    </button>
                    <span className="text-sm font-bold text-coffee-text flex items-center gap-2">
                      {grinder.name}
                      {grinder.isDefault && (
                        <span className="text-[10px] bg-coffee-secondary/10 text-coffee-primary font-bold px-1.5 py-0.5 rounded-full border border-coffee-secondary/10">
                          デフォルト
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleStartEdit(grinder)}
                      className={`p-1.5 rounded-full transition-colors ${
                        editingId === grinder.id
                          ? "text-coffee-primary bg-coffee-secondary/10"
                          : "text-coffee-secondary/40 hover:text-coffee-primary hover:bg-coffee-secondary/5"
                      }`}
                      title="編集"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteGrinder(grinder.id)}
                      className="text-coffee-secondary/40 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                      title="削除"
                      disabled={editingId !== null}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[9px] text-coffee-secondary pl-8">
                  <span className="bg-coffee-background px-1.5 py-0.5 rounded border border-coffee-secondary/10">
                    細: ~{grinder.fineMax}
                  </span>
                  <span className="bg-coffee-background px-1.5 py-0.5 rounded border border-coffee-secondary/10">
                    中細: {grinder.fineMax + 1}~{grinder.mediumFineMax}
                  </span>
                  <span className="bg-coffee-background px-1.5 py-0.5 rounded border border-coffee-secondary/10">
                    中: {grinder.mediumFineMax + 1}~{grinder.mediumMax}
                  </span>
                  <span className="bg-coffee-background px-1.5 py-0.5 rounded border border-coffee-secondary/10">
                    中粗: {grinder.mediumMax + 1}~{grinder.mediumCoarseMax}
                  </span>
                  <span className="bg-coffee-background px-1.5 py-0.5 rounded border border-coffee-secondary/10">
                    粗: {grinder.mediumCoarseMax + 1}+
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Grinders;
