import { Loading } from "@yahatapp/ui";
import styles from "../form-page.module.css";
import { mutationNotices } from "@/lib/mutationNotices";
import { useEffect, useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { beanCreateSchema } from "@/contracts";
import { beanQueries, mutations, queryKeys } from "@/lib/queries";
import { getTodayJSTString, toBeanCreateInput, type BeanFormValues } from "@/lib/form-values";
import { BeanFields } from "@/components/forms/BeanFields";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
const AddBean = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const parentBeanId = searchParams.get("parentBeanId");
  const isVersionMode = Boolean(parentBeanId);
  const today = useMemo(() => getTodayJSTString(), []);
  const parentQuery = useQuery(beanQueries.detail(parentBeanId ?? ""));
  const createMutation = useMutation({
    meta: mutationNotices.createBean,
    mutationFn: (values: BeanFormValues) => {
      const payload = toBeanCreateInput(values, parentBeanId);
      const parsed = beanCreateSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error("入力内容を確認してください。");
      }
      return mutations.createBean({
        json: parsed.data,
      });
    },
    onSuccess: async () => {
      analytics.trackEvent("bean_create_success");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.beans,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.stores,
      });
      void navigate("/beans");
    },
  });
  const defaultValues: BeanFormValues = {
    name: "",
    coffeeType: "regular",
    origin: "",
    region: "",
    variety: "",
    farm: "",
    producer: "",
    purchaseStore: "",
    storeId: "",
    storeName: "",
    storePrefecture: "",
    storeLinks: [""],
    roastLevel: 3,
    roastDate: "",
    purchaseDate: today,
    processMethod: "",
    note: "",
    version: today.replace(/-/g, "."),
    isArchived: false,
  };
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync(value);
    },
  });
  useEffect(() => {
    if (!isVersionMode || !parentQuery.data) return;
    form.setFieldValue("name", parentQuery.data.name);
    form.setFieldValue("coffeeType", parentQuery.data.coffeeType);
    form.setFieldValue("origin", parentQuery.data.origin ?? "");
    form.setFieldValue("region", parentQuery.data.region ?? "");
    form.setFieldValue("variety", parentQuery.data.variety ?? "");
    form.setFieldValue("farm", parentQuery.data.farm ?? "");
    form.setFieldValue("producer", parentQuery.data.producer ?? "");
    form.setFieldValue("purchaseStore", parentQuery.data.purchaseStore ?? "");
    form.setFieldValue("storeId", parentQuery.data.storeId ?? "");
    form.setFieldValue("roastLevel", parentQuery.data.roastLevel ?? 3);
    form.setFieldValue("processMethod", parentQuery.data.processMethod ?? "");
  }, [form, isVersionMode, parentQuery.data]);
  if (isVersionMode && parentQuery.isPending) {
    return <Loading />;
  }
  if (isVersionMode && parentQuery.isError) {
    return (
      <div className={styles.fallback}>
        <p>元の豆情報を取得できませんでした。</p>
        <Button onClick={() => void parentQuery.refetch()}>再読み込み</Button>
      </div>
    );
  }
  return (
    <div className={styles.page}>
      <div className={styles.row}>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="戻る">
          <ArrowLeft size={20} aria-hidden={true} />
        </Button>
        <h2 className={styles.pageHeading}>
          {isVersionMode ? "豆のバージョンを追加" : "豆を登録する"}
        </h2>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          // Mutation errors are shown by the shared notices and the form error state.
          void form.handleSubmit().catch(() => undefined);
        }}
        className={styles.stack}
      >
        <BeanFields form={form} isVersionMode={isVersionMode} />
        {createMutation.isError && (
          <p className={styles.error}>
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : "保存に失敗しました。"}
          </p>
        )}
        <Button
          type="submit"
          disabled={createMutation.isPending}
          fullWidth
          size="lg"
          loading={createMutation.isPending}
        >
          {createMutation.isPending ? (
            "保存中..."
          ) : (
            <>
              <Save size={18} className={styles.icon} aria-hidden={true} />
              保存する
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
export default AddBean;
