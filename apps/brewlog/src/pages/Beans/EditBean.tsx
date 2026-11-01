import { Loading } from "@yahatapp/ui";
import styles from "../form-page.module.css";
import { mutationNotices } from "@/lib/mutationNotices";
import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { beanUpdateSchema } from "@/contracts";
import { beanQueries, mutations, queryKeys } from "@/lib/queries";
import { toBeanUpdateInput, type BeanFormValues } from "@/lib/form-values";
import { BeanFields } from "@/components/forms/BeanFields";
import { Button } from "@/components/ui/button";
const EditBean = () => {
  const { id } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const beanQuery = useQuery(beanQueries.detail(id ?? ""));
  const updateMutation = useMutation({
    meta: mutationNotices.updateBean,
    mutationFn: (values: BeanFormValues) => {
      if (!id) throw new Error("豆IDがありません。");
      const payload = toBeanUpdateInput(values);
      const parsed = beanUpdateSchema.safeParse(payload);
      if (!parsed.success) throw new Error("入力内容を確認してください。");
      return mutations.updateBean({
        param: {
          id,
        },
        json: parsed.data,
      });
    },
    onSuccess: async (bean) => {
      queryClient.setQueryData(queryKeys.bean(bean.id), bean);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.beans,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.stores,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.logs,
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
    purchaseDate: "",
    processMethod: "",
    note: "",
    version: "",
    isArchived: false,
  };
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await updateMutation.mutateAsync(value);
    },
  });
  useEffect(() => {
    if (!beanQuery.data) return;
    form.reset({
      name: beanQuery.data.name,
      coffeeType: beanQuery.data.coffeeType,
      origin: beanQuery.data.origin ?? "",
      region: beanQuery.data.region ?? "",
      variety: beanQuery.data.variety ?? "",
      farm: beanQuery.data.farm ?? "",
      producer: beanQuery.data.producer ?? "",
      purchaseStore: beanQuery.data.purchaseStore ?? "",
      storeId: beanQuery.data.storeId ?? "",
      storeName: "",
      storePrefecture: "",
      storeLinks: [""],
      roastLevel: beanQuery.data.roastLevel ?? 3,
      roastDate: beanQuery.data.roastDate ?? "",
      purchaseDate: beanQuery.data.purchaseDate ?? "",
      processMethod: beanQuery.data.processMethod ?? "",
      note: beanQuery.data.note ?? "",
      version: beanQuery.data.version ?? "",
      isArchived: beanQuery.data.isArchived,
    });
  }, [beanQuery.data, form]);
  if (beanQuery.isPending) {
    return <Loading />;
  }
  if (beanQuery.isError || !beanQuery.data) {
    return (
      <div className={styles.fallback}>
        <p>豆が見つかりませんでした。</p>
        <Button onClick={() => void navigate("/beans")}>豆一覧へ戻る</Button>
      </div>
    );
  }
  return (
    <div className={styles.page}>
      <div className={styles.row}>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="戻る">
          <ArrowLeft size={20} aria-hidden={true} />
        </Button>
        <h2 className={styles.pageHeading}>豆の編集</h2>
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
        <BeanFields form={form} isVersionMode={false} />
        {updateMutation.isError && (
          <p className={styles.error}>
            {updateMutation.error instanceof Error
              ? updateMutation.error.message
              : "保存に失敗しました。"}
          </p>
        )}
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
      </form>
    </div>
  );
};
export default EditBean;
