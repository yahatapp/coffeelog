import { useEffect, useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { beanCreateSchema } from "@/contracts";
import { beanQueries, mutations, queryKeys } from "@/lib/queries";
import { getTodayJSTString, toBeanCreateInput, type BeanFormValues } from "@/lib/form-values";
import { BeanFields } from "@/components/forms/BeanFields";
import { Button } from "@/components/ui/button";

const AddBean = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const parentBeanId = searchParams.get("parentBeanId");
  const isVersionMode = Boolean(parentBeanId);
  const today = useMemo(() => getTodayJSTString(), []);
  const parentQuery = useQuery(beanQueries.detail(parentBeanId ?? ""));

  const createMutation = useMutation({
    mutationFn: (values: BeanFormValues) => {
      const payload = toBeanCreateInput(values, parentBeanId);
      const parsed = beanCreateSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error("入力内容を確認してください。");
      }
      return mutations.createBean({ json: parsed.data });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.beans });
      void navigate("/beans");
    },
  });

  const defaultValues: BeanFormValues = {
    name: "",
    coffeeType: "regular",
    origin: "",
    purchaseStore: "",
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
    form.setFieldValue("purchaseStore", parentQuery.data.purchaseStore ?? "");
    form.setFieldValue("roastLevel", parentQuery.data.roastLevel ?? 3);
    form.setFieldValue("processMethod", parentQuery.data.processMethod ?? "");
  }, [form, isVersionMode, parentQuery.data]);

  if (isVersionMode && parentQuery.isPending) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-coffee-primary" size={32} />
      </div>
    );
  }

  if (isVersionMode && parentQuery.isError) {
    return (
      <div className="text-center p-8 text-coffee-secondary">
        <p>元の豆情報を取得できませんでした。</p>
        <Button className="mt-4" onClick={() => void parentQuery.refetch()}>
          再読み込み
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold text-coffee-primary">
          {isVersionMode ? "豆のバージョンを追加" : "豆を登録する"}
        </h2>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="space-y-4"
      >
        <BeanFields form={form} isVersionMode={isVersionMode} />
        {createMutation.isError && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : "保存に失敗しました。"}
          </p>
        )}
        <Button
          type="submit"
          className="w-full rounded-2xl h-12 text-base shadow-lg bg-coffee-primary hover:bg-coffee-primary/90"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <>
              <Save size={18} className="mr-2" />
              保存する
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default AddBean;
