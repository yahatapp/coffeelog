import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";
import { COFFEE_COUNTRIES } from "../../utils/flag";

interface Bean {
  id: string;
  name: string;
  origin: string | null;
  purchaseStore: string | null;
  roastLevel: number | null;
  roastDate: string | null;
  purchaseDate: string | null;
  isArchived: boolean;
  processMethod?: string | null;
  note?: string | null;
}

const PROCESS_METHODS = [
  { value: "ナチュラル", label: "ナチュラル" },
  { value: "ウォッシュド", label: "ウォッシュド" },
  { value: "ホワイトハニー", label: "ホワイトハニー" },
  { value: "イエローハニー", label: "イエローハニー" },
  { value: "レッドハニー", label: "レッドハニー" },
  { value: "ブラックハニー", label: "ブラックハニー" },
  { value: "パルプドナチュラル", label: "パルプドナチュラル" },
  { value: "スマトラ式", label: "スマトラ式" },
  { value: "アナエロビック", label: "アナエロビック (嫌気性発酵)" },
  { value: "その他", label: "その他" },
];

const EditBean = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    origin: "",
    purchaseStore: "",
    roastLevel: 3,
    roastDate: "",
    purchaseDate: "",
    isArchived: false,
    processMethod: "",
    note: "",
  });

  useEffect(() => {
    const fetchBean = async () => {
      try {
        const res = await api.api.beans.$get();
        if (res.ok) {
          const beans = (await res.json()) as Bean[];
          const bean = beans.find((b) => b.id === id);
          if (bean) {
            setFormData({
              name: bean.name,
              origin: bean.origin || "",
              purchaseStore: bean.purchaseStore || "",
              roastLevel: bean.roastLevel || 3,
              roastDate: bean.roastDate || "",
              purchaseDate: bean.purchaseDate || "",
              isArchived: bean.isArchived,
              processMethod: bean.processMethod || "",
              note: bean.note || "",
            });
          } else {
            console.error("Bean not found");
            void navigate("/beans");
          }
        }
      } catch (err) {
        console.error("Failed to fetch bean details", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchBean();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSaving(true);

    try {
      const res = await api.api.beans[":id"].$patch({
        param: { id },
        json: {
          name: formData.name,
          origin: formData.origin || null,
          purchaseStore: formData.purchaseStore || null,
          roastLevel: formData.roastLevel,
          roastDate: formData.roastDate || null,
          purchaseDate: formData.purchaseDate || null,
          isArchived: formData.isArchived,
          processMethod: formData.processMethod || null,
          note: formData.note || null,
        },
      });

      if (res.ok) {
        void navigate("/beans");
      } else {
        const errorData = await res.text();
        console.error("Failed to update bean", errorData);
      }
    } catch (err) {
      console.error("Error updating bean", err);
    } finally {
      setIsSaving(false);
    }
  };

  const getRoastLabel = (level: number) => {
    const labels = ["浅煎り", "中浅煎り", "中煎り", "中深煎り", "深煎り"];
    return labels[level - 1];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-coffee-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold text-coffee-primary">豆の編集</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">豆の名前</Label>
              <Input
                id="name"
                placeholder="例: エチオピア イルガチェフェ"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-xl border-coffee-secondary/20 focus:ring-coffee-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="origin">産地</Label>
              <Input
                id="origin"
                list="origins"
                placeholder="例: エチオピア (候補から選択も可能)"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                className="rounded-xl border-coffee-secondary/20"
              />
              <datalist id="origins">
                {COFFEE_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseStore">購入店</Label>
              <Input
                id="purchaseStore"
                placeholder="例: ブルーボトルコーヒー"
                value={formData.purchaseStore}
                onChange={(e) => setFormData({ ...formData, purchaseStore: e.target.value })}
                className="rounded-xl border-coffee-secondary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="processMethod">精製方法</Label>
              <select
                id="processMethod"
                className="flex h-10 w-full rounded-xl border border-coffee-secondary/20 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-primary transition-all text-coffee-text"
                value={formData.processMethod}
                onChange={(e) => setFormData({ ...formData, processMethod: e.target.value })}
              >
                <option value="">選択してください (任意)</option>
                {PROCESS_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="roast">焙煎度</Label>
                <span className="text-sm font-bold text-coffee-primary">
                  {getRoastLabel(formData.roastLevel)}
                </span>
              </div>
              <div className="px-1">
                <input
                  type="range"
                  id="roast"
                  min="1"
                  max="5"
                  step="1"
                  className="w-full h-2 bg-coffee-secondary/20 rounded-lg appearance-none cursor-pointer accent-coffee-primary"
                  value={formData.roastLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      roastLevel: parseInt(e.target.value),
                    })
                  }
                />
                <div className="flex justify-between mt-2 text-[10px] text-coffee-secondary">
                  <span>浅煎り</span>
                  <span>中煎り</span>
                  <span>深煎り</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roastDate">焙煎日</Label>
              <Input
                id="roastDate"
                type="date"
                value={formData.roastDate}
                onChange={(e) => setFormData({ ...formData, roastDate: e.target.value })}
                className="rounded-xl border-coffee-secondary/20 focus:ring-coffee-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">購入日</Label>
              <Input
                id="date"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="rounded-xl border-coffee-secondary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">メモ</Label>
              <textarea
                id="note"
                rows={4}
                placeholder="豆の特徴や購入時の情報などを自由に記録できます"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="flex min-h-24 w-full resize-y rounded-xl border border-coffee-secondary/20 bg-white px-3 py-2 text-sm text-coffee-text ring-offset-white transition-all placeholder:text-coffee-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-primary focus-visible:ring-offset-2"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                id="archive"
                type="checkbox"
                checked={formData.isArchived}
                onChange={(e) => setFormData({ ...formData, isArchived: e.target.checked })}
                className="h-4 w-4 rounded border-coffee-secondary/35 text-coffee-primary focus:ring-coffee-primary focus:ring-offset-0"
              />
              <Label
                htmlFor="archive"
                className="text-sm font-medium cursor-pointer text-coffee-text"
              >
                この豆をアーカイブする (一覧に表示されなくなります)
              </Label>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full rounded-2xl h-12 text-base shadow-lg bg-coffee-primary hover:bg-coffee-primary/90"
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <>
              <Save size={18} className="mr-2" />
              変更を保存する
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default EditBean;
