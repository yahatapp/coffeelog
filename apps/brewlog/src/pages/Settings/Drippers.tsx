import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2, Pencil, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

interface Dripper {
  id: string;
  name: string;
  isDefault: boolean;
}

const Drippers = () => {
  const navigate = useNavigate();
  const [drippers, setDrippers] = useState<Dripper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newDripperName, setNewDripperName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleStartEdit = (dripper: Dripper) => {
    setEditingId(dripper.id);
    setNewDripperName(dripper.name);
    setIsDefault(dripper.isDefault);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewDripperName("");
    setIsDefault(false);
  };

  const fetchDrippers = async () => {
    try {
      const res = await api.api.drippers.$get();
      if (res.ok) {
        setDrippers(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch drippers", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchDrippers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDripperName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Edit mode (PATCH)
        const res = await api.api.drippers[":id"].$patch({
          param: { id: editingId },
          json: {
            name: newDripperName.trim(),
            isDefault,
          },
        });

        if (res.ok) {
          handleCancelEdit();
          await fetchDrippers();
        }
      } else {
        // Add mode (POST)
        const res = await api.api.drippers.$post({
          json: {
            name: newDripperName.trim(),
            isDefault,
          },
        });

        if (res.ok) {
          setNewDripperName("");
          setIsDefault(false);
          await fetchDrippers();
        }
      }
    } catch (err) {
      console.error(editingId ? "Failed to update dripper" : "Failed to add dripper", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await api.api.drippers[":id"].$patch({
        param: { id },
        json: { isDefault: true },
      });
      if (res.ok) {
        await fetchDrippers();
      }
    } catch (err) {
      console.error("Failed to set default dripper", err);
    }
  };

  const handleDeleteDripper = async (id: string) => {
    if (!confirm("このドリッパーを削除しますか？")) return;

    try {
      const res = await api.api.drippers[":id"].$delete({
        param: { id },
      });

      if (res.ok) {
        await fetchDrippers();
      }
    } catch (err) {
      console.error("Failed to delete dripper", err);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold text-coffee-primary">ドリッパー管理</h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 bg-white p-4 rounded-2xl border border-coffee-secondary/15 shadow-sm"
      >
        <div className="flex justify-between items-center pb-1 border-b border-coffee-secondary/10 mb-2">
          <span className="text-xs font-bold text-coffee-primary">
            {editingId ? "ドリッパーの設定を編集" : "新規ドリッパー登録"}
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

        <div className="flex space-x-2">
          <Input
            placeholder="新しいドリッパー名..."
            value={newDripperName}
            onChange={(e) => setNewDripperName(e.target.value)}
            className="rounded-xl border-coffee-secondary/20 flex-1 bg-white"
            required
            disabled={isSubmitting}
          />
          <div className="flex gap-2">
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
                className="rounded-xl border border-coffee-secondary/20 text-coffee-secondary px-3 text-xs"
              >
                キャンセル
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-coffee-primary hover:bg-coffee-primary/90 px-4 text-xs"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin mr-1" size={16} />
              ) : editingId ? (
                <Pencil size={16} className="mr-1" />
              ) : (
                <Plus size={16} className="mr-1" />
              )}
              {editingId ? "保存" : "追加"}
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2 pt-1">
          <input
            type="checkbox"
            id="isDefaultDripper"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="rounded border-coffee-secondary/30 text-coffee-primary focus:ring-coffee-primary/50 w-4 h-4 cursor-pointer"
          />
          <label
            htmlFor="isDefaultDripper"
            className="text-xs font-medium text-coffee-text cursor-pointer select-none"
          >
            このドリッパーをデフォルトに設定する
          </label>
        </div>
      </form>

      {/* Dripper List */}
      {isLoading ? (
        <div className="h-20 w-full animate-pulse bg-coffee-secondary/10 rounded-xl" />
      ) : drippers.length === 0 ? (
        <div className="text-center py-8 bg-coffee-secondary/5 rounded-2xl border border-dashed border-coffee-secondary/15 text-xs text-coffee-secondary">
          登録されているドリッパーはありません。
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-coffee-secondary/10">
            {drippers.map((dripper) => (
              <div
                key={dripper.id}
                className={`p-4 flex items-center justify-between hover:bg-coffee-secondary/5 transition-colors ${
                  editingId === dripper.id
                    ? "bg-coffee-secondary/5 border-l-2 border-coffee-primary"
                    : ""
                }`}
              >
                <div className="flex items-center space-x-3 flex-1 mr-2">
                  <button
                    onClick={() => handleSetDefault(dripper.id)}
                    className={`p-1 rounded-full transition-colors ${
                      dripper.isDefault
                        ? "text-coffee-primary"
                        : "text-coffee-secondary/30 hover:text-coffee-primary hover:bg-coffee-secondary/5"
                    }`}
                    title={dripper.isDefault ? "デフォルト" : "デフォルトに設定"}
                    disabled={editingId !== null}
                  >
                    <CheckCircle
                      size={18}
                      className={dripper.isDefault ? "fill-coffee-primary text-white" : ""}
                    />
                  </button>
                  <span className="text-sm font-medium text-coffee-text flex items-center gap-2">
                    {dripper.name}
                    {dripper.isDefault && (
                      <span className="text-[10px] bg-coffee-secondary/10 text-coffee-primary font-bold px-1.5 py-0.5 rounded-full border border-coffee-secondary/10">
                        デフォルト
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleStartEdit(dripper)}
                    className={`p-1.5 rounded-full transition-colors ${
                      editingId === dripper.id
                        ? "text-coffee-primary bg-coffee-secondary/10"
                        : "text-coffee-secondary/40 hover:text-coffee-primary hover:bg-coffee-secondary/5"
                    }`}
                    title="編集"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteDripper(dripper.id)}
                    className="text-coffee-secondary/40 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                    title="削除"
                    disabled={editingId !== null}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Drippers;
