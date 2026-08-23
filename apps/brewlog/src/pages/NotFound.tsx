import { Link } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="bg-coffee-secondary/10 p-6 rounded-full mb-6">
        <AlertCircle size={64} className="text-coffee-primary" />
      </div>
      <h2 className="text-2xl font-bold text-coffee-primary mb-2">ページが見つかりません</h2>
      <p className="text-coffee-secondary mb-8">
        お探しのページは削除されたか、URLが間違っている可能性があります。
      </p>
      <Link to="/">
        <Button className="flex items-center gap-2">
          <Home size={18} />
          ホームへ戻る
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
