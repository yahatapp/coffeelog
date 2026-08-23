import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-6xl mb-4">☕</p>
      <h2 className="text-xl font-bold text-cafe-text mb-2">ページが見つかりません</h2>
      <p className="text-cafe-secondary mb-6">お探しのページは存在しないようです。</p>
      <Link
        to="/"
        className="bg-cafe-primary text-white font-semibold py-2 px-6 rounded-xl shadow-md hover:bg-cafe-primary/90 active:scale-[0.98] transition-all"
      >
        ホームに戻る
      </Link>
    </div>
  );
};

export default NotFoundPage;
