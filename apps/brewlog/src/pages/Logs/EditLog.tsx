import { PageStatus } from "@yahatapp/ui";
import {
  FormNotice,
  focusFirstInvalidField,
  useUnsavedChanges,
  PageHeading,
  useAppBack,
  usePreviousAppPath,
} from "@yahatapp/ui";
import { validateBrewLog } from "@/lib/brew-log-validation";
import { Loading, ErrorState, EmptyState } from "@yahatapp/ui";
import styles from "../form-page.module.css";
import { mutationNotices } from "@/lib/mutationNotices";
import { useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { logUpdateSchema } from "@/contracts";
import { BrewLogFields } from "@/components/forms/BrewLogFields";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import {
  beanQueries,
  dripperQueries,
  grinderQueries,
  logQueries,
  mutations,
  queryKeys,
  type Bean,
  type BrewLogResponse,
  type Dripper,
  type Grinder,
} from "@/lib/queries";
import { getTodayJSTString, toLogUpdateInput, type LogFormValues } from "@/lib/form-values";
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
  brewComment: log.brewComment ?? "",
  note: log.note ?? "",
  tempType: parseTempType(log.tempType),
  iceAmount: log.iceAmount ?? "",
  drawdownTime: log.drawdownTime ?? "",
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
  brewComment: "抽出コメント",
  note: "テイスティングノート",
  tempType: "抽出タイプ",
  iceAmount: "氷の量",
  drawdownTime: "落ち切り時間",
  hasBypass: "加水",
  pours: "注ぎ方",
};
const valuesEqual = (left: unknown, right: unknown) =>
  JSON.stringify(left) === JSON.stringify(right);
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
  const navigate = useNavigate();
  const previousPath = usePreviousAppPath();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [originalValues] = useState(() => toFormValues(log));
  const saved = useRef(false);
  const updateMutation = useMutation({
    meta: mutationNotices.updateLog,
    mutationFn: (values: LogFormValues) => {
      const parsed = logUpdateSchema.parse(toLogUpdateInput(values));
      return mutations.updateLog({
        param: {
          id,
        },
        json: parsed,
      });
    },
    onSuccess: async () => {
      analytics.trackEvent("record_update_success");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.logs,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.stores,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.log(id),
      });
      saved.current = true;
      if (previousPath === `/logs/${id}`) void navigate(-1);
      else void navigate(`/logs/${id}`, { replace: true });
    },
    onError: () => {
      analytics.trackEvent("record_update_error");
      setError(
        "抽出記録の更新に失敗しました。入力内容は保持されています。もう一度更新してください。",
      );
    },
  });
  const form = useForm({
    defaultValues: originalValues,
    validators: { onSubmit: validateBrewLog },
    onSubmit: async ({ value }) => {
      setError(null);
      await updateMutation.mutateAsync(value);
    },
  });
  const goBack = useAppBack(`/logs/${id}`);
  const { confirmation } = useUnsavedChanges(
    () => JSON.stringify(form.state.values) !== JSON.stringify(originalValues),
    () => form.state.isSubmitting || updateMutation.isPending,
    saved,
  );
  return (
    <div className={styles.page}>
      <div className={styles.row}>
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          aria-label="戻る"
          disabled={updateMutation.isPending}
        >
          <ArrowLeft size={20} aria-hidden={true} />
        </Button>
        <PageHeading className={styles.pageHeading}>抽出記録を編集</PageHeading>
      </div>

      {confirmation}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (form.state.isSubmitting) return;
          setError(null);
          const element = event.currentTarget;
          void form
            .handleSubmit()
            .catch(() => undefined)
            .then(() => focusFirstInvalidField(element));
        }}
        noValidate
      >
        <fieldset className={styles.stack} disabled={updateMutation.isPending}>
          <BrewLogFields
            disabled={updateMutation.isPending}
            form={form}
            beans={beans}
            drippers={drippers}
            grinders={grinders}
            navigate={(path) => void navigate(path)}
          />

          {masterDataError && (
            <div className={styles.error}>
              <p>マスターデータの取得に失敗しました。</p>
              <Button type="button" variant="ghost" onClick={onRetryMasterData}>
                再読み込み
              </Button>
            </div>
          )}

          <form.Subscribe selector={(state) => state.values}>
            {(values) => {
              const changedFields = (
                Object.keys(dirtyFieldLabels) as Array<keyof LogFormValues>
              ).filter((key) => !valuesEqual(values[key], originalValues[key]));
              if (changedFields.length === 0) return null;
              return (
                <div className={styles.warning}>
                  <span>未保存の変更があります：</span>{" "}
                  {changedFields.map((key) => dirtyFieldLabels[key]).join("、")}
                </div>
              );
            }}
          </form.Subscribe>

          {error && <FormNotice message={error} />}

          <Button
            type="submit"
            disabled={updateMutation.isPending}
            fullWidth
            size="lg"
            loading={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              "保存中..."
            ) : (
              <>
                <Save size={18} className={styles.icon} aria-hidden={true} />
                変更を保存する
              </>
            )}
          </Button>
        </fieldset>
      </form>
    </div>
  );
};
const EditLog = () => {
  const { id } = useParams<{
    id: string;
  }>();
  const logQuery = useQuery(logQueries.detail(id ?? ""));
  const beansQuery = useQuery(beanQueries.all());
  const drippersQuery = useQuery(dripperQueries.all());
  const grindersQuery = useQuery(grinderQueries.all());
  const isLoading =
    logQuery.isPending ||
    beansQuery.isPending ||
    drippersQuery.isPending ||
    grindersQuery.isPending;
  if (!id)
    return (
      <PageStatus>
        <EmptyState title="記録が見つかりませんでした。" />
      </PageStatus>
    );
  if (isLoading) {
    return (
      <PageStatus>
        <Loading />
      </PageStatus>
    );
  }
  const queryError = beansQuery.error ?? drippersQuery.error ?? grindersQuery.error;
  const isMasterDataUnavailable =
    (beansQuery.isError && !beansQuery.data) ||
    (drippersQuery.isError && !drippersQuery.data) ||
    (grindersQuery.isError && !grindersQuery.data);
  if (!id || !logQuery.data || isMasterDataUnavailable) {
    return (
      <PageStatus>
        <ErrorState
          message="編集データの取得に失敗しました。"
          onRetry={() => {
            void Promise.all([
              logQuery.refetch(),
              beansQuery.refetch(),
              drippersQuery.refetch(),
              grindersQuery.refetch(),
            ]);
          }}
        />
      </PageStatus>
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
        void Promise.all([beansQuery.refetch(), drippersQuery.refetch(), grindersQuery.refetch()]);
      }}
    />
  );
};
export default EditLog;
