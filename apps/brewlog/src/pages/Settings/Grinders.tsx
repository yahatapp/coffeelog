import { Loading, ErrorState } from "@yahatapp/ui";
import { Field } from "@yahatapp/ui";
import styles from "./equipment.module.css";
import { Checkbox } from "@yahatapp/ui";
import { mutationNotices } from "@/lib/mutationNotices";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Loader2, Pencil, Plus, Sliders, Trash2 } from "lucide-react";
import { grinderQueries, mutations, queryKeys, type Grinder } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, EmptyState } from "@yahatapp/ui";
import { Input } from "@/components/ui/input";
import type { FormApiLike } from "@/components/forms/types";
import { getFirstValidationError } from "@/components/forms/formValidation";
import { grinderFormSchema, type GrinderFormValues } from "@/components/forms/grinderForm";
const emptyValues: GrinderFormValues = {
  name: "",
  fineMax: 6,
  mediumFineMax: 9,
  mediumMax: 15,
  mediumCoarseMax: 22,
  isDefault: false,
};
const toPayload = (value: GrinderFormValues) => ({
  name: value.name.trim(),
  fineMax: Number(value.fineMax),
  mediumFineMax: Number(value.mediumFineMax),
  mediumMax: Number(value.mediumMax),
  mediumCoarseMax: Number(value.mediumCoarseMax),
  isDefault: value.isDefault,
});
const GrinderFields = ({
  form,
  isSubmitting,
}: {
  form: FormApiLike<GrinderFormValues>;
  isSubmitting: boolean;
}) => {
  const numberFields = [
    ["fineMax", "fine", "細挽き上限 (Clicks)"],
    ["mediumFineMax", "medFine", "中細挽き上限 (Clicks)"],
    ["mediumMax", "medium", "中挽き上限 (Clicks)"],
    ["mediumCoarseMax", "medCoarse", "中粗挽き上限 (Clicks)"],
  ] as const;
  return (
    <>
      <div className={styles.fieldStack}>
        <form.Field name="name">
          {(field) => (
            <Field
              id="grinderName"
              required
              label={<>グラインダー名</>}
              error={getFirstValidationError(field.state.meta.errors)}
            >
              {(control) => (
                <Input
                  {...control}
                  id="grinderName"
                  placeholder="例: コマンダンテ C40、タイムモア C3"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  required
                  disabled={isSubmitting}
                />
              )}
            </Field>
          )}
        </form.Field>
      </div>
      <fieldset className={styles.rangeFields}>
        <legend className={styles.rangeLegend}>
          <Sliders size={16} aria-hidden="true" />
          挽き目段階の境界値（クリック数上限）
        </legend>
        <p className={[styles.helper, styles.muted].join(" ")}>
          それぞれの挽き目の最大クリック数を設定します。
        </p>
        <div className={[styles.tiles, styles.helper, styles.separated].join(" ")}>
          {numberFields.map(([name, id, label]) => (
            <div className={styles.fieldStack} key={name}>
              <form.Field name={name}>
                {(field) => (
                  <Field
                    id={id}
                    required
                    label={<>{label}</>}
                    error={getFirstValidationError(field.state.meta.errors)}
                  >
                    {(control) => (
                      <Input
                        {...control}
                        id={id}
                        type="number"
                        min="1"
                        max="40"
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(
                            event.target.value === "" ? "" : Number(event.target.value),
                          )
                        }
                        onBlur={field.handleBlur}
                        disabled={isSubmitting}
                        required
                      />
                    )}
                  </Field>
                )}
              </form.Field>
            </div>
          ))}
        </div>
        <form.Subscribe
          selector={(state) => [
            state.values.fineMax,
            state.values.mediumFineMax,
            state.values.mediumMax,
            state.values.mediumCoarseMax,
          ]}
        >
          {([fineMax, mediumFineMax, mediumMax, mediumCoarseMax]) => (
            <div
              className={[
                styles.tonal,
                styles.border,
                styles.rounded,
                styles.compact,
                styles.helper,
                styles.muted,
                styles.separated,
              ].join(" ")}
            >
              挽き目レンジの目安:
              <ul className={[styles.fieldStack, styles.separated].join(" ")}>
                <li>細挽き: ~{fineMax || 0}</li>
                <li>
                  中細挽き: {(Number(fineMax) || 0) + 1}~{mediumFineMax || 0}
                </li>
                <li>
                  中挽き: {(Number(mediumFineMax) || 0) + 1}~{mediumMax || 0}
                </li>
                <li>
                  中粗挽き: {(Number(mediumMax) || 0) + 1}~{mediumCoarseMax || 0}
                </li>
                <li>粗挽き: {(Number(mediumCoarseMax) || 0) + 1}+</li>
              </ul>
            </div>
          )}
        </form.Subscribe>
      </fieldset>
      <form.Field name="isDefault">
        {(field) => (
          <label className={styles.checkboxLabel}>
            <Checkbox
              type="checkbox"
              checked={field.state.value}
              onChange={(event) => field.handleChange(event.target.checked)}
            />
            <span>このグラインダーをデフォルトに設定する</span>
          </label>
        )}
      </form.Field>
    </>
  );
};
const Grinders = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const grindersQuery = useQuery(grinderQueries.all());
  const grinders = grindersQuery.data ?? [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState(emptyValues);
  const createMutation = useMutation({
    meta: mutationNotices.createGrinder,
    mutationFn: (value: GrinderFormValues) =>
      mutations.createGrinder({
        json: toPayload(value),
      }),
    onSuccess: async () => {
      setDefaultValues(emptyValues);
      form.reset(emptyValues);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.grinders,
      });
    },
  });
  const updateMutation = useMutation({
    meta: mutationNotices.updateGrinder,
    mutationFn: ({ id, value }: { id: string; value: GrinderFormValues }) =>
      mutations.updateGrinder({
        param: {
          id,
        },
        json: toPayload(value),
      }),
    onSuccess: async () => {
      setEditingId(null);
      setDefaultValues(emptyValues);
      form.reset(emptyValues);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.grinders,
      });
    },
  });
  const defaultMutation = useMutation({
    meta: mutationNotices.defaultGrinder,
    mutationFn: (id: string) =>
      mutations.updateGrinder({
        param: {
          id,
        },
        json: {
          isDefault: true,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.grinders,
      });
    },
  });
  const deleteMutation = useMutation({
    meta: mutationNotices.deleteGrinder,
    mutationFn: (id: string) => mutations.deleteGrinder(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.grinders,
      });
    },
  });
  const form = useForm({
    defaultValues,
    validators: {
      onBlur: grinderFormSchema,
      onSubmit: grinderFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (editingId)
        await updateMutation.mutateAsync({
          id: editingId,
          value,
        });
      else await createMutation.mutateAsync(value);
    },
  });
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const handleStartEdit = (grinder: Grinder) => {
    setEditingId(grinder.id);
    const values = {
      name: grinder.name,
      fineMax: grinder.fineMax,
      mediumFineMax: grinder.mediumFineMax,
      mediumMax: grinder.mediumMax,
      mediumCoarseMax: grinder.mediumCoarseMax,
      isDefault: grinder.isDefault,
    };
    setDefaultValues(values);
    form.reset(values);
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  };
  const handleCancelEdit = () => {
    setEditingId(null);
    setDefaultValues(emptyValues);
    form.reset(emptyValues);
  };
  const formError = createMutation.error ?? updateMutation.error;
  return (
    <div className={styles.stack}>
      <div className={styles.row}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          type="button"
          aria-label="戻る"
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className={[styles.heading, styles.strong, styles.accent].join(" ")}>
          グラインダー管理
        </h2>
      </div>
      <Card>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            // Mutation errors are shown by the shared notices and the form error state.
            void form.handleSubmit().catch(() => undefined);
          }}
          className={styles.form}
        >
          <CardHeader>
            <CardTitle>{editingId ? "グラインダーの設定を編集" : "新規グラインダー登録"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.formFields}>
              <GrinderFields form={form} isSubmitting={isSubmitting} />
              <form.Subscribe selector={(state) => state.errors}>
                {(errors) => {
                  const validationError = getFirstValidationError(errors);
                  return validationError ? (
                    <p className={[styles.helper, styles.dangerText].join(" ")} role="alert">
                      {validationError}
                    </p>
                  ) : null;
                }}
              </form.Subscribe>
              <div className={styles.row}>
                {editingId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                  >
                    キャンセル
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting} fullWidth loading={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className={styles.spinner} size={14} />
                  ) : editingId ? (
                    <Pencil size={14} />
                  ) : (
                    <Plus size={14} />
                  )}
                  {editingId ? "変更を保存" : "グラインダーを登録"}
                </Button>
              </div>
              {formError && (
                <p className={[styles.helper, styles.dangerText].join(" ")}>
                  {formError instanceof Error ? formError.message : "保存に失敗しました。"}
                </p>
              )}
            </div>
          </CardContent>
        </form>
      </Card>
      {grindersQuery.isPending ? (
        <Loading className={styles.state} />
      ) : grindersQuery.isError ? (
        <div className={[styles.roomy, styles.center, styles.muted].join(" ")}>
          <ErrorState
            message={<>グラインダー一覧の取得に失敗しました。</>}
            onRetry={() => void grindersQuery.refetch()}
          />
        </div>
      ) : grinders.length === 0 ? (
        <EmptyState title="登録されているグラインダーはありません。" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>登録済みのグラインダー</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.divided}>
              {grinders.map((grinder) => (
                <div
                  key={grinder.id}
                  role="group"
                  aria-label={grinder.name}
                  className={styles.masterEntry}
                >
                  <div className={styles.fieldStack}>
                    <div className={styles.masterHeading}>
                      <Button
                        type="button"
                        onClick={() => defaultMutation.mutate(grinder.id)}
                        title={grinder.isDefault ? "デフォルト" : "デフォルトに設定"}
                        disabled={editingId !== null || defaultMutation.isPending}
                        aria-label={grinder.isDefault ? "デフォルト" : "デフォルトに設定"}
                        aria-pressed={grinder.isDefault}
                        variant="ghost"
                        size="icon"
                      >
                        <CheckCircle size={18} className={grinder.isDefault ? styles.accent : ""} />
                      </Button>
                      <span className={styles.masterName}>
                        {grinder.name}
                        {grinder.isDefault && (
                          <span
                            className={[
                              styles.tonal,
                              styles.pill,
                              styles.helper,
                              styles.strong,
                              styles.accent,
                            ].join(" ")}
                          >
                            デフォルト
                          </span>
                        )}
                      </span>
                    </div>
                    <div className={styles.masterActions}>
                      <Button
                        type="button"
                        onClick={() => handleStartEdit(grinder)}
                        title="編集"
                        aria-label="編集"
                        variant="outline"
                        size="sm"
                      >
                        <Pencil size={16} aria-hidden="true" /> 編集
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          if (confirm("このグラインダーを削除しますか？"))
                            deleteMutation.mutate(grinder.id);
                        }}
                        title="削除"
                        disabled={editingId !== null || deleteMutation.isPending}
                        aria-label="削除"
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 size={16} aria-hidden="true" /> 削除
                      </Button>
                    </div>
                  </div>
                  <div
                    className={[styles.row, styles.wrapping, styles.helper, styles.muted].join(" ")}
                  >
                    <span className={[styles.tonal, styles.rounded].join(" ")}>
                      細: ~{grinder.fineMax}
                    </span>
                    <span className={[styles.tonal, styles.rounded].join(" ")}>
                      中細: {grinder.fineMax + 1}~{grinder.mediumFineMax}
                    </span>
                    <span className={[styles.tonal, styles.rounded].join(" ")}>
                      中: {grinder.mediumFineMax + 1}~{grinder.mediumMax}
                    </span>
                    <span className={[styles.tonal, styles.rounded].join(" ")}>
                      中粗: {grinder.mediumMax + 1}~{grinder.mediumCoarseMax}
                    </span>
                    <span className={[styles.tonal, styles.rounded].join(" ")}>
                      粗: {grinder.mediumCoarseMax + 1}+
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default Grinders;
