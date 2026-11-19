import {
  FormNotice,
  focusFirstInvalidField,
  useUnsavedChanges,
  PageHeading,
  useAppBack,
  usePreviousAppPath,
} from "@yahatapp/ui";
import { validateBrewLog } from "@/lib/brew-log-validation";
import styles from "../form-page.module.css";
import { mutationNotices } from "@/lib/mutationNotices";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { logCreateSchema } from "@/contracts";
import { beanQueries, dripperQueries, grinderQueries, mutations, queryKeys } from "@/lib/queries";
import { getTodayJSTString, toLogCreateInput, type LogFormValues } from "@/lib/form-values";
import { BrewLogFields } from "@/components/forms/BrewLogFields";
import { Button } from "@/components/ui/button";
import { getBrewableBeans } from "@/lib/bean-versions";
import { analytics } from "@/lib/analytics";
const AddLog = () => {
  const navigate = useNavigate();
  const previousPath = usePreviousAppPath();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const beansQuery = useQuery(beanQueries.all());
  const drippersQuery = useQuery(dripperQueries.all());
  const grindersQuery = useQuery(grinderQueries.all());
  const allBeans = beansQuery.data;
  const beans = useMemo(
    () => getBrewableBeans(allBeans ?? [], searchParams.get("beanId")),
    [allBeans, searchParams],
  );
  const drippers = drippersQuery.data;
  const grinders = grindersQuery.data;
  const queryError = beansQuery.error ?? drippersQuery.error ?? grindersQuery.error;
  const saved = useRef(false);
  const createMutation = useMutation({
    meta: mutationNotices.createLog,
    mutationFn: (values: LogFormValues) => {
      const parsed = logCreateSchema.parse(toLogCreateInput(values));
      return mutations.createLog({
        json: parsed,
      });
    },
    onSuccess: async () => {
      analytics.trackEvent("record_create_success");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.logs,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.stores,
      });
      saved.current = true;
      if (previousPath === "/logs") void navigate(-1);
      else void navigate("/logs", { replace: true });
    },
    onError: () => {
      analytics.trackEvent("record_create_error");
      setError(
        "抽出記録の保存に失敗しました。入力内容は保持されています。もう一度保存してください。",
      );
    },
  });
  const [defaultValues] = useState<LogFormValues>(() => ({
    beanId: searchParams.get("beanId") ?? "",
    brewDate: getTodayJSTString(),
    dripperId: "",
    grinderId: "",
    grindSize: 10,
    waterTemp: 85,
    beanAmount: 10,
    waterAmount: 150,
    rating: 3,
    brewComment: "",
    note: "",
    tempType: "hot",
    iceAmount: "",
    drawdownTime: "",
    hasBypass: false,
    pours: [],
  }));
  const initialValues = useRef(defaultValues);
  const form = useForm({
    defaultValues,
    validators: { onSubmit: validateBrewLog },
    onSubmit: async ({ value }) => {
      setError(null);
      await createMutation.mutateAsync(value);
    },
  });
  useEffect(() => {
    if (!form.getFieldValue("dripperId") && !form.getFieldMeta("dripperId")?.isDirty) {
      const defaultDripper = drippers?.find((dripper) => dripper.isDefault);
      if (defaultDripper) {
        initialValues.current = { ...initialValues.current, dripperId: defaultDripper.id };
        form.setFieldValue("dripperId", defaultDripper.id, { dontUpdateMeta: true });
      }
    }
    if (!form.getFieldValue("grinderId") && !form.getFieldMeta("grinderId")?.isDirty) {
      const defaultGrinder = grinders?.find((grinder) => grinder.isDefault);
      if (defaultGrinder) {
        initialValues.current = { ...initialValues.current, grinderId: defaultGrinder.id };
        form.setFieldValue("grinderId", defaultGrinder.id, { dontUpdateMeta: true });
      }
    }
  }, [drippers, form, grinders]);
  const isFetchingMasters =
    beansQuery.isPending || drippersQuery.isPending || grindersQuery.isPending;
  const goBack = useAppBack("/logs");
  const { confirmation } = useUnsavedChanges(
    () => JSON.stringify(form.state.values) !== JSON.stringify(initialValues.current),
    () => form.state.isSubmitting || createMutation.isPending,
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
          disabled={createMutation.isPending}
        >
          <ArrowLeft size={20} aria-hidden={true} />
        </Button>
        <PageHeading className={styles.pageHeading}>抽出を記録する</PageHeading>
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
        <fieldset className={styles.stack} disabled={createMutation.isPending}>
          <BrewLogFields
            disabled={createMutation.isPending}
            form={form}
            beans={beans}
            drippers={drippers ?? []}
            grinders={grinders ?? []}
            isFetchingMasters={isFetchingMasters}
            navigate={(path) => void navigate(path)}
          />
          {queryError && (
            <div className={styles.error}>
              <p>マスターデータの取得に失敗しました。</p>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  void Promise.all([
                    beansQuery.refetch(),
                    drippersQuery.refetch(),
                    grindersQuery.refetch(),
                  ]);
                }}
              >
                再読み込み
              </Button>
            </div>
          )}
          {error && <FormNotice message={error} />}
          <Button
            type="submit"
            disabled={createMutation.isPending || isFetchingMasters || beans.length === 0}
            fullWidth
            size="lg"
            loading={createMutation.isPending}
          >
            {createMutation.isPending ? (
              "保存中..."
            ) : (
              <>
                <Save size={18} className={styles.icon} aria-hidden={true} />
                記録を保存する
              </>
            )}
          </Button>
        </fieldset>
      </form>
    </div>
  );
};
export default AddLog;
