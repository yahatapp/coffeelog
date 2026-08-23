import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Star, Plus, Minus } from "lucide-react";
import { api } from "@/lib/api";
import { Button, cn } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";

interface Bean {
  id: string;
  name: string;
}

interface Dripper {
  id: string;
  name: string;
}

interface Grinder {
  id: string;
  name: string;
  fineMax: number;
  mediumFineMax: number;
  mediumMax: number;
  mediumCoarseMax: number;
}

interface Pour {
  pourNumber: number;
  waterAmount: number;
  duration: number;
  pourType: "all" | "center_around" | "center_only";
}

const parseTempType = (value: string): "hot" | "ice" => (value === "ice" ? "ice" : "hot");

const parsePourType = (value: string): Pour["pourType"] => {
  if (value === "center_around" || value === "center_only") return value;
  return "all";
};

const EditLog = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beans, setBeans] = useState<Bean[]>([]);
  const [drippers, setDrippers] = useState<Dripper[]>([]);
  const [grinders, setGrinders] = useState<Grinder[]>([]);

  const [formData, setFormData] = useState({
    beanId: "",
    brewDate: "",
    dripperId: "",
    grinderId: "",
    grindSize: 10,
    waterTemp: 85 as number | "",
    beanAmount: 10 as number | "",
    waterAmount: 150 as number | "",
    rating: 3,
    note: "",
    tempType: "hot" as "hot" | "ice",
    iceAmount: "" as string | number,
    yieldAmount: "" as string | number,
    drawdownTime: "" as string | number,
    bloomingTime: "" as string | number,
    hasBypass: false,
    pours: [] as Pour[],
  });

  const [originalData, setOriginalData] = useState<typeof formData | null>(null);

  const handleTempTypeChange = (type: "hot" | "ice") => {
    if (type === "ice") {
      setFormData((prev) => ({
        ...prev,
        tempType: "ice",
        iceAmount: prev.iceAmount || 80,
        yieldAmount: prev.yieldAmount || 200,
        beanAmount: prev.beanAmount === 10 ? 16 : prev.beanAmount,
        waterAmount: prev.waterAmount === 150 ? 120 : prev.waterAmount,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        tempType: "hot",
        iceAmount: "",
        yieldAmount: prev.waterAmount === 120 ? 150 : prev.waterAmount,
        beanAmount: prev.beanAmount === 16 ? 10 : prev.beanAmount,
        waterAmount: prev.waterAmount === 120 ? 150 : prev.waterAmount,
      }));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;

        // Fetch masters
        const [beansRes, drippersRes, grindersRes, logRes] = await Promise.all([
          api.api.beans.$get(),
          api.api.drippers.$get(),
          api.api.grinders.$get(),
          api.api.logs[":id"].$get({ param: { id } }),
        ]);

        if (beansRes.ok) setBeans(await beansRes.json());
        if (drippersRes.ok) setDrippers(await drippersRes.json());
        if (grindersRes.ok) setGrinders(await grindersRes.json());

        if (logRes.ok) {
          const log = await logRes.json();
          const initialData: typeof formData = {
            beanId: log.beanId,
            brewDate:
              log.brewDate ||
              (log.createdAt
                ? new Date(log.createdAt).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0]),
            dripperId: log.dripperId || "",
            grinderId: log.grinderId || "",
            grindSize: log.grindSize !== null ? log.grindSize : 10,
            waterTemp: log.waterTemp !== null ? log.waterTemp : 85,
            beanAmount: log.beanAmount !== null ? log.beanAmount : 10,
            waterAmount: log.waterAmount !== null ? log.waterAmount : 150,
            rating: log.rating !== null ? log.rating : 3,
            note: log.note || "",
            tempType: parseTempType(log.tempType),
            iceAmount: log.iceAmount !== null && log.iceAmount !== undefined ? log.iceAmount : "",
            yieldAmount:
              log.yieldAmount !== null && log.yieldAmount !== undefined ? log.yieldAmount : "",
            drawdownTime:
              log.drawdownTime !== null && log.drawdownTime !== undefined ? log.drawdownTime : "",
            bloomingTime:
              log.bloomingTime !== null && log.bloomingTime !== undefined ? log.bloomingTime : "",
            hasBypass: log.hasBypass || false,
            pours:
              log.pours?.map((p) => ({
                pourNumber: p.pourNumber,
                waterAmount: p.waterAmount,
                duration: p.duration,
                pourType: parsePourType(p.pourType),
              })) || [],
          };
          setFormData(initialData);
          setOriginalData(initialData);
        } else {
          console.error("Log not found");
          void navigate("/logs");
        }
      } catch (err) {
        console.error("Failed to load edit log details", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [id, navigate]);

  const selectedGrinder = grinders.find((g) => g.id === formData.grinderId) || null;

  const isChanged = (key: keyof typeof formData) => {
    if (!originalData) return false;
    return formData[key] !== originalData[key];
  };

  const getGrindLabel = (clicks: number, grinder: Grinder | null) => {
    const fm = grinder?.fineMax ?? 6;
    const mfm = grinder?.mediumFineMax ?? 9;
    const mm = grinder?.mediumMax ?? 15;
    const mcm = grinder?.mediumCoarseMax ?? 22;

    if (clicks <= fm) return "細挽き";
    if (clicks <= mfm) return "中細挽き";
    if (clicks <= mm) return "中挽き";
    if (clicks <= mcm) return "中粗挽き";
    return "粗挽き";
  };

  const handleNumPoursChange = (num: number) => {
    const targetNum = Math.max(0, Math.min(10, num));
    setFormData((prev) => {
      const currentLength = prev.pours.length;
      if (targetNum === currentLength) return prev;

      let updatedPours = [...prev.pours];
      if (targetNum > currentLength) {
        for (let i = currentLength; i < targetNum; i++) {
          updatedPours.push({
            pourNumber: i + 1,
            waterAmount: 30,
            duration:
              i === 0
                ? prev.bloomingTime === ""
                  ? 30
                  : parseInt(prev.bloomingTime.toString()) || 30
                : 30,
            pourType: "center_around" as const,
          });
        }
      } else {
        updatedPours = updatedPours.slice(0, targetNum);
      }

      return {
        ...prev,
        pours: updatedPours,
      };
    });
  };

  const handlePourChange = <Key extends keyof Pour>(index: number, key: Key, value: Pour[Key]) => {
    setFormData((prev) => {
      const updatedPours = [...prev.pours];
      updatedPours[index] = {
        ...updatedPours[index],
        [key]: value,
      };

      let nextBloomingTime = prev.bloomingTime;
      if (index === 0 && key === "duration" && typeof value === "number") {
        nextBloomingTime = value;
      }

      return {
        ...prev,
        pours: updatedPours,
        bloomingTime: nextBloomingTime,
      };
    });
  };

  const handleBloomingTimeChange = (val: number | "") => {
    setFormData((prev) => {
      const updatedPours = [...prev.pours];
      if (updatedPours.length > 0) {
        updatedPours[0] = {
          ...updatedPours[0],
          duration: val === "" ? 0 : val,
        };
      }
      return {
        ...prev,
        bloomingTime: val,
        pours: updatedPours,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!id || !formData.beanId) return;

    if (!formData.dripperId) {
      setError("ドリッパーを選択してください。");
      return;
    }

    // 数値のバリデーション
    if (
      formData.waterTemp === "" ||
      isNaN(Number(formData.waterTemp)) ||
      Number(formData.waterTemp) <= 0
    ) {
      setError("湯温には0より大きい数値を入力してください。");
      return;
    }
    if (
      formData.beanAmount === "" ||
      isNaN(Number(formData.beanAmount)) ||
      Number(formData.beanAmount) <= 0
    ) {
      setError("豆量には0より大きい数値を入力してください。");
      return;
    }
    if (
      formData.waterAmount === "" ||
      isNaN(Number(formData.waterAmount)) ||
      Number(formData.waterAmount) <= 0
    ) {
      setError("注水量には0より大きい数値を入力してください。");
      return;
    }
    if (
      formData.yieldAmount === "" ||
      isNaN(Number(formData.yieldAmount)) ||
      Number(formData.yieldAmount) <= 0
    ) {
      setError("仕上がり量には0より大きい数値を入力してください。");
      return;
    }
    if (formData.tempType === "ice") {
      if (
        formData.iceAmount === "" ||
        isNaN(Number(formData.iceAmount)) ||
        Number(formData.iceAmount) <= 0
      ) {
        setError("氷の量には0より大きい数値を入力してください。");
        return;
      }
    }

    setIsSaving(true);

    try {
      const res = await api.api.logs[":id"].$patch({
        param: { id },
        json: {
          beanId: formData.beanId,
          method: null,
          grindSize: formData.grindSize,
          waterTemp: Number(formData.waterTemp),
          beanAmount: Number(formData.beanAmount),
          waterAmount: Number(formData.waterAmount),
          rating: formData.rating,
          note: formData.note || null,
          brewDate: formData.brewDate || null,
          dripperId: formData.dripperId || null,
          grinderId: formData.grinderId || null,
          tempType: formData.tempType,
          hasBypass: formData.hasBypass,
          iceAmount:
            formData.tempType === "ice" ? parseFloat(formData.iceAmount.toString()) || null : null,
          yieldAmount:
            formData.yieldAmount !== ""
              ? parseFloat(formData.yieldAmount.toString()) || null
              : null,
          drawdownTime:
            formData.drawdownTime !== ""
              ? parseInt(formData.drawdownTime.toString()) || null
              : null,
          bloomingTime:
            formData.bloomingTime !== ""
              ? parseInt(formData.bloomingTime.toString()) || null
              : null,
          pours: formData.pours.map((p, idx) => ({
            pourNumber: p.pourNumber,
            waterAmount: parseFloat(p.waterAmount.toString()) || 0,
            duration: idx === formData.pours.length - 1 ? 0 : parseInt(p.duration.toString()) || 0,
            pourType: p.pourType,
          })),
        },
      });

      if (res.ok) {
        void navigate(`/logs/${id}`);
      } else {
        console.error("Failed to update log", await res.text());
      }
    } catch (err) {
      console.error("Error submitting updated log", err);
    } finally {
      setIsSaving(false);
    }
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
        <h2 className="text-xl font-bold text-coffee-primary">抽出記録を編集</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Bean Select */}
            <div className="space-y-2">
              <Label htmlFor="bean">コーヒー豆</Label>
              <select
                id="bean"
                className={cn(
                  "flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-primary transition-all",
                  isChanged("beanId")
                    ? "border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/5"
                    : "border-coffee-secondary/20",
                )}
                value={formData.beanId}
                onChange={(e) => setFormData({ ...formData, beanId: e.target.value })}
                required
              >
                <option value="" disabled>
                  豆を選択してください
                </option>
                {beans.map((bean) => (
                  <option key={bean.id} value={bean.id}>
                    {bean.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Select */}
            <div className="space-y-2">
              <Label htmlFor="brewDate">抽出日</Label>
              <Input
                id="brewDate"
                type="date"
                value={formData.brewDate}
                onChange={(e) => setFormData({ ...formData, brewDate: e.target.value })}
                className={cn(
                  "rounded-xl transition-all",
                  isChanged("brewDate")
                    ? "border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/5"
                    : "border-coffee-secondary/20",
                )}
                required
              />
            </div>

            {/* Dripper Selection */}
            <div className="space-y-2">
              <Label htmlFor="dripper">ドリッパー</Label>
              <select
                id="dripper"
                className={cn(
                  "flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-primary transition-all",
                  isChanged("dripperId")
                    ? "border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/5"
                    : "border-coffee-secondary/20",
                )}
                value={formData.dripperId}
                onChange={(e) => setFormData({ ...formData, dripperId: e.target.value })}
                required
              >
                <option value="" disabled>
                  ドリッパーを選択してください
                </option>
                {drippers.map((dripper) => (
                  <option key={dripper.id} value={dripper.id}>
                    {dripper.name}
                  </option>
                ))}
              </select>
              {drippers.length === 0 && (
                <p className="text-[10px] text-red-500">
                  ドリッパーが登録されていません。{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/settings/drippers")}
                    className="underline font-bold ml-1 hover:text-red-700"
                  >
                    設定から登録してください
                  </button>
                </p>
              )}
            </div>

            {/* Grinder Master Selection */}
            <div className="space-y-2">
              <Label htmlFor="grinder">グラインダー</Label>
              <select
                id="grinder"
                className={cn(
                  "flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-primary transition-all",
                  isChanged("grinderId")
                    ? "border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/5"
                    : "border-coffee-secondary/20",
                )}
                value={formData.grinderId}
                onChange={(e) => setFormData({ ...formData, grinderId: e.target.value })}
              >
                <option value="">選択してください</option>
                {grinders.map((grinder) => (
                  <option key={grinder.id} value={grinder.id}>
                    {grinder.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Grind Click Slider */}
            <div
              className={cn(
                "space-y-2 pt-1 p-2 rounded-xl transition-all duration-300",
                isChanged("grindSize") &&
                  "bg-amber-50/5 ring-1 ring-amber-500/30 border border-amber-500/30",
              )}
            >
              <div className="flex justify-between items-center">
                <Label htmlFor="grindSize">
                  挽き目 (クリック数:{" "}
                  <span className="font-bold text-coffee-primary">{formData.grindSize}</span>)
                </Label>
                <span className="text-sm font-bold bg-coffee-primary/10 text-coffee-primary px-3 py-0.5 rounded-full">
                  {getGrindLabel(formData.grindSize, selectedGrinder)}
                </span>
              </div>
              <div className="px-1 pt-1 pb-6 relative">
                {(() => {
                  const minGrind = selectedGrinder
                    ? Math.max(
                        1,
                        Math.min(
                          Number(formData.grindSize) || 1,
                          selectedGrinder.fineMax - Math.ceil(selectedGrinder.fineMax * 0.2),
                        ),
                      )
                    : 1;

                  const maxGrind = selectedGrinder
                    ? Math.max(
                        Number(formData.grindSize) || 1,
                        Math.round(selectedGrinder.mediumCoarseMax * 1.2),
                      )
                    : Math.max(Number(formData.grindSize) || 1, 40);

                  const fineMax = selectedGrinder?.fineMax ?? 6;
                  const medFineMax = selectedGrinder?.mediumFineMax ?? 9;
                  const medMax = selectedGrinder?.mediumMax ?? 15;
                  const medCoarseMax = selectedGrinder?.mediumCoarseMax ?? 22;

                  const rawMarks = [
                    { val: 1, label: "1 (細)" },
                    { val: fineMax + 1, label: `${fineMax + 1} (中細)` },
                    { val: medFineMax + 1, label: `${medFineMax + 1} (中)` },
                    { val: medMax + 1, label: `${medMax + 1} (中粗)` },
                    { val: medCoarseMax + 1, label: `${medCoarseMax + 1} (粗)` },
                  ];

                  const filteredMarks = rawMarks.filter(
                    (m) => m.val >= minGrind && m.val <= maxGrind,
                  );

                  if (!filteredMarks.some((m) => m.val === minGrind)) {
                    filteredMarks.push({ val: minGrind, label: `${minGrind}` });
                  }
                  if (!filteredMarks.some((m) => m.val === maxGrind)) {
                    filteredMarks.push({ val: maxGrind, label: `${maxGrind}` });
                  }

                  filteredMarks.sort((a, b) => a.val - b.val);

                  return (
                    <>
                      <input
                        type="range"
                        id="grindSize"
                        min={minGrind}
                        max={maxGrind}
                        step="1"
                        className="w-full h-2 bg-coffee-secondary/20 rounded-lg appearance-none cursor-pointer accent-coffee-primary"
                        value={formData.grindSize}
                        onChange={(e) =>
                          setFormData({ ...formData, grindSize: parseInt(e.target.value) })
                        }
                      />
                      {selectedGrinder ? (
                        <div className="absolute w-full left-0 right-0 h-6 mt-2 text-[9px] text-coffee-secondary px-1">
                          {filteredMarks.map((item, idx) => {
                            const percent =
                              maxGrind > minGrind
                                ? ((item.val - minGrind) / (maxGrind - minGrind)) * 100
                                : 0;
                            return (
                              <div
                                key={idx}
                                className="absolute -translate-x-1/2 flex flex-col items-center"
                                style={{ left: `calc(12px + ${percent}% - ${percent * 0.24}px)` }}
                              >
                                <span className="h-1 w-0.5 bg-coffee-secondary/40 mb-1" />
                                <span className="whitespace-nowrap font-bold">{item.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex justify-between mt-2 text-[10px] text-coffee-secondary">
                          <span>1 (細挽き)</span>
                          <span>20 (中挽き)</span>
                          <span>40 (粗挽き)</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Hot / Ice temperature toggle */}
            <div
              className={cn(
                "space-y-2 pt-1 p-2 rounded-xl transition-all duration-300",
                isChanged("tempType") &&
                  "bg-amber-50/5 ring-1 ring-amber-500/30 border border-amber-500/30",
              )}
            >
              <Label>抽出タイプ</Label>
              <div className="grid grid-cols-2 gap-2 bg-coffee-secondary/10 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => handleTempTypeChange("hot")}
                  className={cn(
                    "py-2 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center space-x-1.5",
                    formData.tempType === "hot"
                      ? "bg-white text-orange-700 shadow-sm border border-orange-200/50"
                      : "text-coffee-secondary hover:text-coffee-text",
                  )}
                >
                  <span>☕</span>
                  <span>ホット</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTempTypeChange("ice")}
                  className={cn(
                    "py-2 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center space-x-1.5",
                    formData.tempType === "ice"
                      ? "bg-white text-blue-700 shadow-sm border border-blue-200/50"
                      : "text-coffee-secondary hover:text-coffee-text",
                  )}
                >
                  <span>❄️</span>
                  <span>アイス</span>
                </button>
              </div>
            </div>

            {/* Ice Coffee parameters */}
            {formData.tempType === "ice" && (
              <div className="pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <div
                  className={cn(
                    "space-y-2 p-2 rounded-xl transition-all duration-300",
                    isChanged("iceAmount") &&
                      "bg-amber-50/5 ring-1 ring-amber-500/30 border border-amber-500/30",
                  )}
                >
                  <Label htmlFor="iceAmt" className="text-blue-700 font-medium flex items-center">
                    <span>🧊</span> <span className="ml-1">氷の量 (g)</span>
                  </Label>
                  <Input
                    id="iceAmt"
                    type="number"
                    step="0.1"
                    value={formData.iceAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        iceAmount: val === "" ? "" : isNaN(parseFloat(val)) ? "" : parseFloat(val),
                      });
                    }}
                    className="rounded-xl border-blue-200 focus-visible:ring-blue-500 bg-blue-50/10"
                    placeholder="例: 80"
                    required
                  />
                </div>
              </div>
            )}

            {/* Temperature, Bean amount, water amount */}
            <div className="grid grid-cols-3 gap-4 pt-1">
              <div
                className={cn(
                  "space-y-2 p-2 rounded-xl transition-all duration-300",
                  isChanged("waterTemp") &&
                    "bg-amber-50/5 ring-1 ring-amber-500/30 border border-amber-500/30",
                )}
              >
                <Label htmlFor="temp">湯温 (℃)</Label>
                <Input
                  id="temp"
                  type="number"
                  value={formData.waterTemp}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      waterTemp: val === "" ? "" : isNaN(parseInt(val)) ? "" : parseInt(val),
                    });
                  }}
                  className={cn(
                    "rounded-xl transition-all",
                    isChanged("waterTemp")
                      ? "border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/5"
                      : "border-coffee-secondary/20",
                  )}
                  required
                />
              </div>
              <div
                className={cn(
                  "space-y-2 p-2 rounded-xl transition-all duration-300",
                  isChanged("beanAmount") &&
                    "bg-amber-50/5 ring-1 ring-amber-500/30 border border-amber-500/30",
                )}
              >
                <Label htmlFor="beanAmt">豆量 (g)</Label>
                <Input
                  id="beanAmt"
                  type="number"
                  step="0.1"
                  value={formData.beanAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      beanAmount: val === "" ? "" : isNaN(parseFloat(val)) ? "" : parseFloat(val),
                    });
                  }}
                  className={cn(
                    "rounded-xl transition-all",
                    isChanged("beanAmount")
                      ? "border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/5"
                      : "border-coffee-secondary/20",
                  )}
                  required
                />
              </div>
              <div
                className={cn(
                  "space-y-2 p-2 rounded-xl transition-all duration-300",
                  isChanged("waterAmount") &&
                    "bg-amber-50/5 ring-1 ring-amber-500/30 border border-amber-500/30",
                )}
              >
                <Label htmlFor="waterAmt">注水量 (ml)</Label>
                <Input
                  id="waterAmt"
                  type="number"
                  value={formData.waterAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    const parsed = val === "" ? "" : isNaN(parseInt(val)) ? "" : parseInt(val);
                    setFormData((prev) => ({
                      ...prev,
                      waterAmount: parsed,
                      yieldAmount: parsed, // Automatically set yieldAmount to the same value
                    }));
                  }}
                  className={cn(
                    "rounded-xl transition-all",
                    isChanged("waterAmount")
                      ? "border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/5"
                      : "border-coffee-secondary/20",
                  )}
                  required
                />
              </div>
            </div>

            {/* Rating */}
            <div
              className={cn(
                "space-y-2 pt-1 p-2 rounded-xl transition-all duration-300",
                isChanged("rating") &&
                  "bg-amber-50/5 ring-1 ring-amber-500/30 border border-amber-500/30",
              )}
            >
              <div className="flex justify-between items-center">
                <Label>評価</Label>
                {isChanged("rating") && (
                  <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-200/50">
                    変更あり
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between bg-coffee-secondary/5 border border-coffee-secondary/10 p-3.5 rounded-2xl w-full shadow-inner">
                {/* Minus Button */}
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = Math.max(1, formData.rating - 0.5);
                    setFormData({ ...formData, rating: nextVal });
                  }}
                  disabled={formData.rating <= 1}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-coffee-secondary/20 shadow-sm text-coffee-primary active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
                  aria-label="評価下げる"
                >
                  <Minus size={18} />
                </button>

                {/* Stars and Score Block */}
                <div className="flex flex-col items-center justify-center px-4 min-w-[130px]">
                  {/* Stars Display */}
                  <div className="flex space-x-1.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFull = star <= formData.rating;
                      const isHalf = !isFull && star - 0.5 <= formData.rating;

                      return (
                        <div
                          key={star}
                          className="relative select-none"
                          style={{ width: 24, height: 24 }}
                        >
                          {/* Background (Empty) / Full Star */}
                          <Star
                            size={24}
                            className={cn(
                              "absolute inset-0 transition-colors pointer-events-none",
                              isFull
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-coffee-secondary/20",
                            )}
                          />
                          {/* Half Star Overlay */}
                          {isHalf && (
                            <div
                              className="absolute inset-0 overflow-hidden pointer-events-none"
                              style={{ width: "50%" }}
                            >
                              <Star
                                size={24}
                                className="fill-yellow-400 text-yellow-400 max-w-none"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Score block: numerator and denominator */}
                  <div className="inline-flex items-baseline mt-1 select-none">
                    <span className="text-xl font-extrabold text-coffee-primary leading-none">
                      {formData.rating.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-coffee-secondary/50 mx-0.5">/</span>
                    <span className="text-[10px] font-bold text-coffee-secondary">5.0</span>
                  </div>
                </div>

                {/* Plus Button */}
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = Math.min(5, formData.rating + 0.5);
                    setFormData({ ...formData, rating: nextVal });
                  }}
                  disabled={formData.rating >= 5}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-coffee-secondary/20 shadow-sm text-coffee-primary active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
                  aria-label="評価上げる"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Pours Recipe */}
            <div className="space-y-4 pt-4 border-t border-coffee-secondary/10">
              <div className="grid grid-cols-2 gap-4">
                {/* 投数 */}
                <div className="flex flex-col justify-between p-3 rounded-2xl bg-coffee-secondary/5 border border-coffee-secondary/10 space-y-2">
                  <Label className="text-xs font-bold text-coffee-primary">注ぎ回数 (投)</Label>
                  <div className="flex items-center space-x-2 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-coffee-secondary/20 text-coffee-primary font-bold text-sm flex-shrink-0"
                      onClick={() => handleNumPoursChange(formData.pours.length - 1)}
                      disabled={formData.pours.length <= 0}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.pours.length}
                      onChange={(e) => handleNumPoursChange(parseInt(e.target.value) || 0)}
                      className="h-8 flex-1 text-center rounded-lg border-coffee-secondary/20 text-xs font-bold focus-visible:ring-coffee-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg border-coffee-secondary/20 text-coffee-primary font-bold text-sm"
                      onClick={() => handleNumPoursChange(formData.pours.length + 1)}
                      disabled={formData.pours.length >= 10}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* 蒸らし時間 */}
                <div className="flex flex-col justify-between p-3 rounded-2xl bg-coffee-secondary/5 border border-coffee-secondary/10 space-y-2">
                  <Label htmlFor="bloomingTime" className="text-xs font-bold text-coffee-primary">
                    蒸らし時間 (秒)
                  </Label>
                  <div className="flex items-center space-x-1.5">
                    <Input
                      id="bloomingTime"
                      type="number"
                      placeholder="例: 30"
                      value={formData.bloomingTime}
                      onChange={(e) =>
                        handleBloomingTimeChange(
                          e.target.value === "" ? "" : parseInt(e.target.value) || 0,
                        )
                      }
                      className="h-8 w-full px-2 text-center rounded-lg border-coffee-secondary/20 text-xs font-bold focus-visible:ring-coffee-primary"
                    />
                    <span className="text-[10px] text-coffee-secondary font-bold">秒</span>
                  </div>
                </div>
              </div>

              {formData.pours.length === 0 ? (
                <p className="text-xs text-coffee-secondary italic text-center py-4 bg-coffee-secondary/5 rounded-2xl border border-dashed border-coffee-secondary/10">
                  投数を増やすと、ここに注ぎ方の詳細入力欄が表示されます。
                </p>
              ) : (
                <div className="space-y-2 border border-coffee-secondary/10 p-3 rounded-2xl bg-coffee-background/30">
                  {/* Header Row */}
                  <div className="flex items-center space-x-2 text-[10px] font-bold text-coffee-secondary px-1 border-b border-coffee-secondary/10 pb-1 mb-1">
                    <span className="w-12 text-center">ステップ</span>
                    <span className="flex-1 text-center">注水量</span>
                    <span className="flex-1 text-center">時間</span>
                    <span className="w-20 text-center">注ぎ方</span>
                  </div>

                  <div className="space-y-2 divide-y divide-coffee-secondary/5">
                    {formData.pours.map((pour, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 pt-2 first:pt-0 animate-in fade-in duration-300"
                      >
                        {/* Label */}
                        <span className="w-12 text-[10px] font-black text-coffee-primary text-center bg-coffee-primary/10 py-1.5 rounded-lg whitespace-nowrap">
                          {pour.pourNumber}投目
                        </span>

                        {/* Water Amount */}
                        <div className="flex-1 flex items-center space-x-1">
                          <select
                            value={pour.waterAmount || ""}
                            onChange={(e) =>
                              handlePourChange(
                                index,
                                "waterAmount",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="h-8 rounded-lg border border-coffee-secondary/20 bg-white px-1 text-xs text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-coffee-primary transition-all w-full text-coffee-text font-medium appearance-none"
                            required
                          >
                            <option value="" disabled hidden>
                              選択
                            </option>
                            {renderWaterAmountOptions(pour.waterAmount)}
                          </select>
                          <span className="text-[10px] text-coffee-secondary font-bold">ml</span>
                        </div>

                        {/* Duration */}
                        <div className="flex-1 flex items-center space-x-1">
                          {index === formData.pours.length - 1 ? (
                            <select
                              disabled
                              value=""
                              className="h-8 rounded-lg border border-coffee-secondary/20 bg-coffee-secondary/5 px-1 text-xs text-center transition-all w-full text-coffee-secondary/40 font-medium appearance-none"
                            >
                              <option value="">不要</option>
                            </select>
                          ) : (
                            <select
                              value={pour.duration || 0}
                              onChange={(e) =>
                                handlePourChange(index, "duration", parseInt(e.target.value) || 0)
                              }
                              className="h-8 rounded-lg border border-coffee-secondary/20 bg-white px-1 text-xs text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-coffee-primary transition-all w-full text-coffee-text font-medium appearance-none"
                              required
                            >
                              {renderDurationOptions(pour.duration)}
                            </select>
                          )}
                          <span className="text-[10px] text-coffee-secondary font-bold">秒</span>
                        </div>

                        {/* Pour Type Selector */}
                        <select
                          value={pour.pourType}
                          onChange={(e) =>
                            handlePourChange(index, "pourType", parsePourType(e.target.value))
                          }
                          className="h-8 rounded-lg border border-coffee-secondary/20 bg-white px-1 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-coffee-primary transition-all w-20 text-coffee-text font-medium text-center"
                        >
                          <option value="all">全体に</option>
                          <option value="center_around">中心付近</option>
                          <option value="center_only">中心のみ</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drawdown Time */}
              <div className="space-y-2 pt-2 border-t border-coffee-secondary/5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-coffee-secondary">落ち切り時間</Label>
                  <span className="text-[9px] text-coffee-secondary">
                    ※お湯を注ぎ始めてからドリッパーを外すまでの総時間
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <select
                      value={
                        formData.drawdownTime === ""
                          ? ""
                          : Math.floor(Number(formData.drawdownTime) / 60)
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const currentSec =
                          formData.drawdownTime === "" ? "" : Number(formData.drawdownTime) % 60;
                        if (val === "" && (currentSec === "" || currentSec === 0)) {
                          setFormData({ ...formData, drawdownTime: "" });
                        } else {
                          const mNum = val === "" ? 0 : parseInt(val);
                          const sNum = currentSec === "" ? 0 : currentSec;
                          if (mNum === 0 && sNum === 0) {
                            setFormData({ ...formData, drawdownTime: "" });
                          } else {
                            setFormData({ ...formData, drawdownTime: mNum * 60 + sNum });
                          }
                        }
                      }}
                      className="flex h-10 w-full rounded-xl border border-coffee-secondary/20 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-primary transition-all text-coffee-text"
                    >
                      <option value="">-</option>
                      {[0, 1, 2, 3, 4, 5].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm font-medium text-coffee-secondary shrink-0">分</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    <select
                      value={formData.drawdownTime === "" ? "" : Number(formData.drawdownTime) % 60}
                      onChange={(e) => {
                        const val = e.target.value;
                        const currentMin =
                          formData.drawdownTime === ""
                            ? ""
                            : Math.floor(Number(formData.drawdownTime) / 60);
                        if (val === "" && (currentMin === "" || currentMin === 0)) {
                          setFormData({ ...formData, drawdownTime: "" });
                        } else {
                          const mNum = currentMin === "" ? 0 : currentMin;
                          const sNum = val === "" ? 0 : parseInt(val);
                          if (mNum === 0 && sNum === 0) {
                            setFormData({ ...formData, drawdownTime: "" });
                          } else {
                            setFormData({ ...formData, drawdownTime: mNum * 60 + sNum });
                          }
                        }
                      }}
                      className="flex h-10 w-full rounded-xl border border-coffee-secondary/20 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-primary transition-all text-coffee-text"
                    >
                      <option value="">-</option>
                      {Array.from({ length: 12 }, (_, i) => i * 5).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm font-medium text-coffee-secondary shrink-0">秒</span>
                  </div>
                </div>
              </div>

              {/* Yield Amount */}
              <div
                className={cn(
                  "space-y-2 pt-2 border-t border-coffee-secondary/5 p-2 rounded-xl transition-all duration-300",
                  isChanged("yieldAmount") &&
                    "bg-amber-50/5 ring-1 ring-amber-500/30 border border-amber-500/30",
                )}
              >
                <div className="flex justify-between items-center">
                  <Label
                    htmlFor="yieldAmt"
                    className={cn(
                      "text-xs font-bold flex items-center",
                      formData.tempType === "ice" ? "text-blue-700" : "text-coffee-secondary",
                    )}
                  >
                    {formData.tempType === "ice" && <span>🥛</span>}
                    <span className={cn(formData.tempType === "ice" && "ml-1")}>
                      仕上がり量 (ml)
                    </span>
                  </Label>
                  {isChanged("yieldAmount") && (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-200/50">
                      変更あり
                    </span>
                  )}
                </div>
                <Input
                  id="yieldAmt"
                  type="number"
                  value={formData.yieldAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      yieldAmount: val === "" ? "" : isNaN(parseInt(val)) ? "" : parseInt(val),
                    }));
                  }}
                  className={cn(
                    "rounded-xl transition-all duration-300 h-10",
                    formData.tempType === "ice"
                      ? "border-blue-200 focus-visible:ring-blue-500 bg-blue-50/10"
                      : isChanged("yieldAmount")
                        ? "border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/5"
                        : "border-coffee-secondary/20",
                  )}
                  placeholder={formData.waterAmount ? formData.waterAmount.toString() : "例: 150"}
                  required
                />
              </div>

              {/* Has Bypass toggle */}
              <div className="space-y-2 pt-2 border-t border-coffee-secondary/5">
                <div className="flex justify-between items-center">
                  <Label>加水</Label>
                  {isChanged("hasBypass") && (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-200/50">
                      変更あり
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 bg-coffee-secondary/10 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, hasBypass: false })}
                    className={cn(
                      "py-2 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center space-x-1.5",
                      !formData.hasBypass
                        ? "bg-white text-coffee-primary shadow-sm border border-coffee-secondary/10"
                        : "text-coffee-secondary hover:text-coffee-text",
                    )}
                  >
                    <span>なし</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, hasBypass: true })}
                    className={cn(
                      "py-2 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center space-x-1.5",
                      formData.hasBypass
                        ? "bg-white text-coffee-primary shadow-sm border border-coffee-secondary/10"
                        : "text-coffee-secondary hover:text-coffee-text",
                    )}
                  >
                    <span>あり</span>
                  </button>
                </div>
              </div>

              {/* Memo */}
              <div className="space-y-2 pt-2 border-t border-coffee-secondary/5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="note">テイスティングノート</Label>
                  {isChanged("note") && (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-200/50">
                      変更あり
                    </span>
                  )}
                </div>
                <textarea
                  id="note"
                  rows={3}
                  className={cn(
                    "flex w-full rounded-xl border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-primary transition-all",
                    isChanged("note")
                      ? "border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/5"
                      : "border-coffee-secondary/20",
                  )}
                  placeholder="味の感想など..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium animate-in fade-in mb-4">
            ⚠️ {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full rounded-2xl h-12 text-base shadow-lg bg-coffee-primary hover:bg-coffee-primary/90"
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
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

const Loader2 = ({ className, size }: { className?: string; size?: number }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={size}
    height={size}
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const waterAmountOptions = Array.from({ length: (100 - 10) / 5 + 1 }, (_, i) => 10 + i * 5);
const durationOptions = Array.from({ length: 60 / 5 + 1 }, (_, i) => i * 5);

const renderWaterAmountOptions = (currentVal: number) => {
  const options = [...waterAmountOptions];
  if (currentVal && !options.includes(currentVal)) {
    options.push(currentVal);
    options.sort((a, b) => a - b);
  }
  return options.map((val) => (
    <option key={val} value={val}>
      {val}
    </option>
  ));
};

const renderDurationOptions = (currentVal: number) => {
  const options = [...durationOptions];
  if (currentVal && !options.includes(currentVal)) {
    options.push(currentVal);
    options.sort((a, b) => a - b);
  }
  return options.map((val) => (
    <option key={val} value={val}>
      {val}
    </option>
  ));
};

export default EditLog;
