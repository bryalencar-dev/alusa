// Centralização de ícones Heroicons (outline) para consistência e fácil troca futura.
// Convenção: usar nomes sem sufixo Icon para facilitar refactors e leitura sem ruído.
// Se precisar da versão solid, importe localmente e documente o motivo.

export { 
  // Navegação / Estrutura
  Squares2X2Icon as Dashboard,
  AcademicCapIcon as Academic,
  BanknotesIcon as Finance,
  CalendarDaysIcon as Calendar,
  DocumentChartBarIcon as Reports,
  BuildingStorefrontIcon as StoreFront,
  TicketIcon as Ticket,
  Cog6ToothIcon as Settings,
  // Usuário / Sessão
  UserCircleIcon as UserCircle,
  ArrowRightOnRectangleIcon as Logout,
  UserPlusIcon as UserPlus,
  // Estados / Feedback
  CheckCircleIcon as CheckCircle,
  ExclamationTriangleIcon as Warning,
  InformationCircleIcon as InfoCircle,
  XCircleIcon as ErrorCircle,
  XMarkIcon as Close,
  // Ações / Controles
  MagnifyingGlassIcon as Search,
  BellIcon as Bell,
  ChevronDownIcon as ChevronDown,
  ChevronUpIcon as ChevronUp,
  ChevronLeftIcon as ChevronLeft,
  ChevronRightIcon as ChevronRight,
  ArrowLongLeftIcon as ArrowPrev,
  ArrowLongRightIcon as ArrowNext,
  PencilSquareIcon as Edit,
  TrashIcon as Trash,
  FunnelIcon as Filter,
  PlusIcon as Plus,
  EnvelopeIcon as Mail,
  EyeIcon as Eye,
  EyeSlashIcon as EyeOff,
  IdentificationIcon as IdCard,
  BookOpenIcon as BookOpen,
  ClockIcon as Clock,
  ArrowPathIcon as Refresh
} from '@heroicons/react/24/outline';

// Ícones adicionais / aliases semânticos centralizados
export { 
  PencilSquareIcon as Edit3, // usado como Edit3
  TrashIcon as Trash2, // Trash já exportado; alias para Trash2
  ArrowPathIcon as RotateCcw, // alias para ação de reset
  WrenchIcon as Wrench, // ajustes / configurações avançadas
  UsersIcon as Users, // listagem de usuários / alunos
  UserIcon as User, // para campos de login
  XMarkIcon as X, // close genérico
  ChevronLeftIcon as ChevronsLeft, // fallback para duplo (não existe direto em heroicons)
  ChevronRightIcon as ChevronsRight // fallback para duplo (não existe direto)
} from '@heroicons/react/24/outline';
