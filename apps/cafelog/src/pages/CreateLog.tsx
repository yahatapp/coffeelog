import { Button, notify, PageHeading, useAppBack } from "@yahatapp/ui";
import styles from "./create-log.module.css";
import { cafeMutationError } from "@/lib/mutationNotices";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CafeLogForm } from "@/components/CafeLogForm";
import { createCafeLogDefaults, type CafeLogFormValues } from "@/lib/cafeLogForm";
import { cafelogQueries } from "@/lib/queries";
import { saveLogWithImages } from "@/lib/saveLog";
import { analytics } from "@/lib/analytics";

const CreateLogPage = () => {
  const navigate = useNavigate();
  const goBack = useAppBack("/logs");
  const saved = useRef(false);
  const queryClient = useQueryClient();
  const defaultValues = useMemo(() => createCafeLogDefaults(), []);
  const createMutation = useMutation({
    mutationFn: (values: CafeLogFormValues) => saveLogWithImages({ values }),
    onSuccess: async ({ data: newLog, notice }) => {
      analytics.trackEvent("record_create_success");
      await queryClient.invalidateQueries({ queryKey: cafelogQueries.all });
      saved.current = true;
      if (!notice) notify({ variant: "success", message: "記録を保存しました。" });
      void navigate(`/logs/${newLog.id}`, {
        replace: true,
        state: { photoWarning: notice?.message },
      });
    },
  });

  const handleSubmit = async (values: CafeLogFormValues) => {
    try {
      await createMutation.mutateAsync(values);
    } catch (submissionError: unknown) {
      analytics.trackEvent("record_create_error");
      console.error("Error saving log", submissionError);
      return;
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Button
          variant="ghost"
          size="icon"
          aria-label="記録一覧に戻る"
          disabled={createMutation.isPending}
          onClick={goBack}
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Button>
        <PageHeading className={styles.heading}>記録を追加</PageHeading>
      </div>

      <CafeLogForm
        defaultValues={defaultValues}
        saved={saved}
        error={createMutation.error ? cafeMutationError(createMutation.error, "保存") : null}
        onSubmit={handleSubmit}
        submitLabel="この内容で保存する"
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
};

export default CreateLogPage;
