import { Button } from "@yahatapp/ui";
import styles from "./create-log.module.css";
import { mutationNotices } from "@/lib/mutationNotices";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CafeLogForm } from "@/components/CafeLogForm";
import { createCafeLogDefaults, type CafeLogFormValues } from "@/lib/cafeLogForm";
import { cafelogQueries } from "@/lib/queries";
import { saveLogWithImages } from "@/lib/saveLog";
import { analytics } from "@/lib/analytics";

const CreateLogPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const defaultValues = useMemo(() => createCafeLogDefaults(), []);
  const createMutation = useMutation({
    meta: mutationNotices.createLog,
    mutationFn: (values: CafeLogFormValues) => saveLogWithImages({ values }),
    onSuccess: async ({ data: newLog }) => {
      analytics.trackEvent("record_create_success");
      await queryClient.invalidateQueries({ queryKey: cafelogQueries.all });
      void navigate(`/logs/${newLog.id}`);
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
        <Button asChild variant="ghost" size="icon">
          <Link to="/logs" aria-label="記録一覧に戻る">
            <ArrowLeft size={20} aria-hidden="true" />
          </Link>
        </Button>
        <h2 className={styles.heading}>記録を追加</h2>
      </div>

      <CafeLogForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitLabel="この内容で保存する"
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
};

export default CreateLogPage;
