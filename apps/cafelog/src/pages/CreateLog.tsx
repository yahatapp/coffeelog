import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CafeLogForm } from "@/components/CafeLogForm";
import { createCafeLogDefaults, type CafeLogFormValues } from "@/lib/cafeLogForm";
import { getErrorMessage } from "@/lib/errors";
import { cafelogQueries, createLog, uploadLogImages } from "@/lib/queries";

const CreateLogPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const defaultValues = useMemo(createCafeLogDefaults, []);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const createMutation = useMutation({ mutationFn: createLog });

  const handleSubmit = async (values: CafeLogFormValues) => {
    setError(null);

    let newLog;
    try {
      newLog = await createMutation.mutateAsync(values);
    } catch (submissionError: unknown) {
      console.error("Error saving log", submissionError);
      setError(getErrorMessage(submissionError, "通信エラーが発生しました。"));
      return;
    }

    setIsUploading(true);
    try {
      await uploadLogImages(newLog.id, values.images);
      await queryClient.invalidateQueries({ queryKey: cafelogQueries.logs().queryKey });
      void navigate("/logs");
    } catch (uploadError: unknown) {
      console.error("Error uploading images", uploadError);
      void navigate(`/logs/${newLog.id}`, {
        state: {
          edit: true,
          photoUploadError: getErrorMessage(
            uploadError,
            "記録は保存されましたが、写真のアップロードに失敗しました。",
          ),
        },
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Link
          to="/logs"
          className="p-1.5 hover:bg-cafe-primary/5 text-cafe-secondary hover:text-cafe-primary rounded-lg transition-all"
        >
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-xl font-bold text-cafe-text">記録を追加</h2>
      </div>

      <CafeLogForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        error={error}
        submitLabel="この内容で保存する"
        isSubmitting={createMutation.isPending || isUploading}
      />
    </div>
  );
};

export default CreateLogPage;
