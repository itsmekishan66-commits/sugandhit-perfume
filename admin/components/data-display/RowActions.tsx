import { Eye, Pencil, Trash2 } from 'lucide-react';

interface RowActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewTitle?: string;
  editTitle?: string;
  deleteTitle?: string;
  size?: 14 | 16 | 18;
}

const RowActions = ({
  onView,
  onEdit,
  onDelete,
  viewTitle = 'View',
  editTitle = 'Edit',
  deleteTitle = 'Delete',
  size = 14,
}: RowActionsProps) => {
  if (!onView && !onEdit && !onDelete) return null;

  const iconCls = `inline-flex h-8 w-8 items-center justify-center rounded-xl cursor-pointer transition-colors`;

  return (
    <div className="inline-flex gap-1.5">
      {onView && (
        <button onClick={onView} className={`${iconCls} border-gold/30 bg-gold/10 text-gold hover:bg-gold/10 hover:text-espresso`} title={viewTitle}>
          <Eye size={size} />
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} className={`${iconCls} border-blue-200 bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-700`} title={editTitle}>
          <Pencil size={size} />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className={`${iconCls} border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700`} title={deleteTitle}>
          <Trash2 size={size} />
        </button>
      )}
    </div>
  );
};

export default RowActions;