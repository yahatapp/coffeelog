import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { beanUpdateSchema } from "@/contracts";
import { beanQueries, mutations, queryKeys } from "@/lib/queries";
import { toBeanUpdateInput, type BeanFormValues } from "@/lib/form-values";
import { BeanFields } from "@/components/forms/BeanFields";
import { Button } from "@/components/ui/button";

const EditBean = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const beanQuery = useQuery(beanQueries.detail(id ?? ""));

  const updateMutation = useMutation({
    mutationFn: (values: BeanFormValues) => {
      if (!id) throw new Error("豆IDがありません。");
      const payload = toBeanUpdateInput(values);
      const parsed = beanUpdateSchema.safeParse(payload);
      if (!parsed.success) throw new Error("入力内容を確認してください。");
      return mutations.updateBean({ param: { id }, json: parsed.data });
    },
    onSuccess: async (bean) => {
      queryClient.setQueryData(queryKeys.bean(bean.id), bean);
      await queryClient.invalidateQueries({ queryKey: queryKeys.beans });
      await queryClient.invalidateQueries({ queryKey: queryKeys.logs });
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
      purchaseStore: beanQuery.data.purchaseStore ?? "",
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
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-coffee-primary" size={32} />
      </div>
    );
  }

  if (beanQuery.isError || !beanQuery.data) {
    return (
      <div className="text-center p-8 text-coffee-secondary">
        <p>豆が見つかりませんでした。</p>
        <Button className="mt-4" onClick={() => void navigate("/beans")}>
          豆一覧へ戻る
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
        <h2 className="text-xl font-bold text-coffee-primary">豆の編集</h2>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="space-y-4"
      >
        <BeanFields form={form} isVersionMode={false} />
        {updateMutation.isError && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {updateMutation.error instanceof Error
              ? updateMutation.error.message
              : "保存に失敗しました。"}
          </p>
        )}
        <Button
          type="submit"
          className="w-full rounded-2xl h-12 text-base shadow-lg bg-coffee-primary hover:bg-coffee-primary/90"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
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
