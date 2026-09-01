import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { logUpdateSchema } from "@/contracts";
import { BrewLogFields } from "@/components/forms/BrewLogFields";
import { Button } from "@/components/ui/button";
import {
  beanQueries,
  dripperQueries,
  grinderQueries,
  logQueries,
  mutations,
  queryKeys,
  type BrewLogResponse,
} from "@/lib/queries";
import { getTodayJSTString, toLogUpdateInput, type LogFormValues } from "@/lib/form-values";

const emptyValues = (): LogFormValues => ({
  beanId: "",
  brewDate: getTodayJSTString(),
  dripperId: "",
  grinderId: "",
  grindSize: 10,
  waterTemp: 85,
  beanAmount: 10,
  waterAmount: 150,
  rating: 3,
  note: "",
  tempType: "hot",
  iceAmount: "",
  yieldAmount: "",
  drawdownTime: "",
  bloomingTime: "",
  hasBypass: false,
  pours: [],
});

const parseTempType = (value: string | null | undefined): "hot" | "ice" =>
  value === "ice" ? "ice" : "hot";

const parsePourType = (
  value: string | null | undefined,
): "all" | "center_around" | "center_only" => {
  if (value === "center_around" || value === "center_only") return value;
  return "all";
};

const toFormValues = (log: BrewLogResponse): LogFormValues => ({
  beanId: log.beanId,
  brewDate:
    log.brewDate ??
    (log.createdAt ? new Date(log.createdAt).toISOString().split("T")[0] : getTodayJSTString()),
  dripperId: log.dripperId ?? "",
  grinderId: log.grinderId ?? "",
  grindSize: log.grindSize ?? 10,
  waterTemp: log.waterTemp ?? 85,
  beanAmount: log.beanAmount ?? 10,
  waterAmount: log.waterAmount ?? 150,
  rating: log.rating ?? 3,
  note: log.note ?? "",
  tempType: parseTempType(log.tempType),
  iceAmount: log.iceAmount ?? "",
  yieldAmount: log.yieldAmount ?? "",
  drawdownTime: log.drawdownTime ?? "",
  bloomingTime: log.bloomingTime ?? "",
  hasBypass: log.hasBypass ?? false,
  pours:
    log.pours?.map((pour) => ({
      pourNumber: pour.pourNumber,
      waterAmount: pour.waterAmount,
      duration: pour.duration,
      pourType: parsePourType(pour.pourType),
    })) ?? [],
});

const dirtyFieldLabels: Record<keyof LogFormValues, string> = {
  beanId: "コーヒー豆",
  brewDate: "抽出日",
  dripperId: "ドリッパー",
  grinderId: "グラインダー",
  grindSize: "挽き目",
  waterTemp: "湯温",
  beanAmount: "豆量",
  waterAmount: "注水量",
  rating: "評価",
  note: "テイスティングノート",
  tempType: "抽出タイプ",
  iceAmount: "氷の量",
  yieldAmount: "仕上がり量",
  drawdownTime: "落ち切り時間",
  bloomingTime: "蒸らし時間",
  hasBypass: "加水",
  pours: "注ぎ方",
};

const valuesEqual = (left: unknown, right: unknown) =>
  JSON.stringify(left) === JSON.stringify(right);

<<<<<<< ours
const EditLog = () => {
  const { id } = useParams<{ id: string }>();
=======
type EditLogFormProps = {
  id: string;
  log: BrewLogResponse;
  beans: Bean[];
  drippers: Dripper[];
  grinders: Grinder[];
  masterDataError: boolean;
  onRetryMasterData: () => void;
};

const EditLogForm = ({
  id,
  log,
  beans,
  drippers,
  grinders,
  masterDataError,
  onRetryMasterData,
}: EditLogFormProps) => {
>>>>>>> theirs
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [originalValues, setOriginalValues] = useState<LogFormValues | null>(null);
  const hydratedLogId = useRef<string | null>(null);

  const logQuery = useQuery(logQueries.detail(id ?? ""));
  const beansQuery = useQuery(beanQueries.all());
  const drippersQuery = useQuery(dripperQueries.all());
  const grindersQuery = useQuery(grinderQueries.all());
  const defaultValues = useMemo(() => emptyValues(), []);

  const updateMutation = useMutation({
    mutationFn: (values: LogFormValues) => {
      if (!id) throw new Error("抽出記録が見つかりません。");
      if (!values.beanId) throw new Error("コーヒー豆を選択してください。");
      if (!values.dripperId) throw new Error("ドリッパーを選択してください。");
      if (values.waterTemp === "" || values.waterTemp <= 0)
        throw new Error("湯温には0より大きい数値を入力してください。");
      if (values.beanAmount === "" || values.beanAmount <= 0)
        throw new Error("豆量には0より大きい数値を入力してください。");
      if (values.waterAmount === "" || values.waterAmount <= 0)
        throw new Error("注水量には0より大きい数値を入力してください。");
      if (values.yieldAmount === "" || values.yieldAmount <= 0)
        throw new Error("仕上がり量には0より大きい数値を入力してください。");
      if (values.tempType === "ice" && (values.iceAmount === "" || values.iceAmount <= 0))
        throw new Error("氷の量には0より大きい数値を入力してください。");

      const parsed = logUpdateSchema.safeParse(toLogUpdateInput(values));
      if (!parsed.success) throw new Error("入力内容を確認してください。");
      return mutations.updateLog({ param: { id }, json: parsed.data });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.logs });
      await queryClient.invalidateQueries({ queryKey: queryKeys.log(id ?? "") });
      void navigate(`/logs/${id}`);
    },
    onError: (mutationError) =>
      setError(mutationError instanceof Error ? mutationError.message : "更新に失敗しました。"),
  });

  const form = useForm<
    LogFormValues,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    unknown
  >({
    defaultValues,
    onSubmit: async ({ value }) => {
      setError(null);
      await updateMutation.mutateAsync(value);
    },
  });

  useEffect(() => {
    if (!id) {
      void navigate("/logs");
      return;
    }
    if (!logQuery.data || hydratedLogId.current === id) return;

    const initialValues = toFormValues(logQuery.data);
    form.reset(initialValues);
    setOriginalValues(initialValues);
    hydratedLogId.current = id;
  }, [form, id, logQuery.data, navigate]);

  useEffect(() => {
    if (logQuery.isError) void navigate("/logs");
  }, [logQuery.isError, navigate]);

  const isLoading =
    logQuery.isPending ||
    beansQuery.isPending ||
    drippersQuery.isPending ||
    grindersQuery.isPending;
  const isFetchingMasters =
    beansQuery.isPending || drippersQuery.isPending || grindersQuery.isPending;
  const queryError = beansQuery.error ?? drippersQuery.error ?? grindersQuery.error;

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

      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="space-y-4"
      >
        <BrewLogFields
          form={form}
          beans={beansQuery.data ?? []}
          drippers={drippersQuery.data ?? []}
          grinders={grindersQuery.data ?? []}
          isFetchingMasters={isFetchingMasters}
          navigate={(path) => void navigate(path)}
        />

<<<<<<< ours
        {queryError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium">
            ⚠️ マスターデータの取得に失敗しました。再読み込みしてください。
=======
        {masterDataError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            <p>マスターデータの取得に失敗しました。</p>
            <Button
              type="button"
              variant="ghost"
              className="mt-2 h-auto px-0 text-xs underline"
              onClick={onRetryMasterData}
            >
              再読み込み
            </Button>
>>>>>>> theirs
          </div>
        )}

        <form.Subscribe selector={(state) => state.values}>
          {(values) => {
            if (!originalValues) return null;
            const changedFields = (
              Object.keys(dirtyFieldLabels) as Array<keyof LogFormValues>
            ).filter((key) => !valuesEqual(values[key], originalValues[key]));
            if (changedFields.length === 0) return null;
            return (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-2xl text-sm font-medium">
                <span>未保存の変更があります：</span>{" "}
                {changedFields.map((key) => dirtyFieldLabels[key]).join("、")}
              </div>
            );
          }}
        </form.Subscribe>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full rounded-2xl h-12 text-base shadow-lg bg-coffee-primary hover:bg-coffee-primary/90"
          disabled={updateMutation.isPending || isFetchingMasters || !originalValues}
        >
          {updateMutation.isPending ? (
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

<<<<<<< ours
=======
const EditLog = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const logQuery = useQuery(logQueries.detail(id ?? ""));
  const beansQuery = useQuery(beanQueries.all());
  const drippersQuery = useQuery(dripperQueries.all());
  const grindersQuery = useQuery(grinderQueries.all());

  useEffect(() => {
    if (!id || logQuery.isError) void navigate("/logs");
  }, [id, logQuery.isError, navigate]);

  const isLoading =
    logQuery.isPending ||
    beansQuery.isPending ||
    drippersQuery.isPending ||
    grindersQuery.isPending;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-coffee-primary" size={32} />
      </div>
    );
  }

  const queryError = beansQuery.error ?? drippersQuery.error ?? grindersQuery.error;
  const isMasterDataUnavailable =
    (beansQuery.isError && !beansQuery.data) ||
    (drippersQuery.isError && !drippersQuery.data) ||
    (grindersQuery.isError && !grindersQuery.data);
  if (!id || !logQuery.data || isMasterDataUnavailable) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
        ⚠️ 編集データの取得に失敗しました。再読み込みしてください。
      </div>
    );
  }

  return (
    <EditLogForm
      key={id}
      id={id}
      log={logQuery.data}
      beans={beansQuery.data ?? []}
      drippers={drippersQuery.data ?? []}
      grinders={grindersQuery.data ?? []}
      masterDataError={Boolean(queryError)}
      onRetryMasterData={() => {
        void Promise.all([
          beansQuery.refetch(),
          drippersQuery.refetch(),
          grindersQuery.refetch(),
        ]);
      }}
    />
  );
};

>>>>>>> theirs
export default EditLog;
