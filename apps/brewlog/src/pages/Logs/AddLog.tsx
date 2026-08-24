import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { logCreateSchema } from "@/contracts";
import { beanQueries, dripperQueries, grinderQueries, mutations, queryKeys } from "@/lib/queries";
import { getTodayJSTString, toLogCreateInput, type LogFormValues } from "@/lib/form-values";
import { BrewLogFields } from "@/components/forms/BrewLogFields";
import { Button } from "@/components/ui/button";

const AddLog = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const beansQuery = useQuery(beanQueries.all());
  const drippersQuery = useQuery(dripperQueries.all());
  const grindersQuery = useQuery(grinderQueries.all());
  const allBeans = beansQuery.data;
  const beans = useMemo(() => {
    const source = allBeans ?? [];
    const latest = new Map<string, (typeof source)[number]>();
    for (const bean of source) {
      const groupId = bean.parentBeanId ?? bean.id;
      const previous = latest.get(groupId);
      if (!previous || new Date(bean.createdAt).getTime() > new Date(previous.createdAt).getTime())
        latest.set(groupId, bean);
    }
    const unique = [...latest.values()].toSorted(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const paramBeanId = searchParams.get("beanId");
    if (paramBeanId && !unique.some((bean) => bean.id === paramBeanId)) {
      const selected = source.find((bean) => bean.id === paramBeanId);
      if (selected) unique.unshift(selected);
    }
    return unique;
  }, [allBeans, searchParams]);
  const drippers = drippersQuery.data;
  const grinders = grindersQuery.data;
  const queryError = beansQuery.error ?? drippersQuery.error ?? grindersQuery.error;

  const createMutation = useMutation({
    mutationFn: (values: LogFormValues) => {
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
      const payload = toLogCreateInput(values);
      const parsed = logCreateSchema.safeParse(payload);
      if (!parsed.success) throw new Error("入力内容を確認してください。");
      return mutations.createLog({ json: parsed.data });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.logs });
      void navigate("/logs");
    },
    onError: (mutationError) =>
      setError(mutationError instanceof Error ? mutationError.message : "保存に失敗しました。"),
  });

  const defaultValues: LogFormValues = {
    beanId: searchParams.get("beanId") ?? "",
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
    yieldAmount: 150,
    drawdownTime: "",
    bloomingTime: "",
    hasBypass: false,
    pours: [],
  };
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setError(null);
      await createMutation.mutateAsync(value);
    },
  });

  useEffect(() => {
    if (!form.getFieldValue("dripperId")) {
      const defaultDripper = drippers?.find((dripper) => dripper.isDefault);
      if (defaultDripper) form.setFieldValue("dripperId", defaultDripper.id);
    }
    if (!form.getFieldValue("grinderId")) {
      const defaultGrinder = grinders?.find((grinder) => grinder.isDefault);
      if (defaultGrinder) form.setFieldValue("grinderId", defaultGrinder.id);
    }
  }, [drippers, form, grinders]);

  const isFetchingMasters =
    beansQuery.isPending || drippersQuery.isPending || grindersQuery.isPending;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold text-coffee-primary">抽出を記録する</h2>
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
          beans={beans}
          drippers={drippers ?? []}
          grinders={grinders ?? []}
          isFetchingMasters={isFetchingMasters}
          navigate={(path) => void navigate(path)}
        />
        {queryError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            <p>マスターデータの取得に失敗しました。</p>
            <Button
              type="button"
              variant="ghost"
              className="mt-2 h-auto px-0 text-xs underline"
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
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium">
            ⚠️ {error}
          </div>
        )}
        <Button
          type="submit"
          className="w-full rounded-2xl h-12 text-base shadow-lg bg-coffee-primary hover:bg-coffee-primary/90"
          disabled={createMutation.isPending || beans.length === 0}
        >
          {createMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Save size={18} className="mr-2" />
              記録を保存する
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default AddLog;
