import { resetEvaluations } from "./database/evaluations";
import { resetNotifications } from "./database/notifications";
import { resetParents } from "./database/parents";
import { resetPlans } from "./database/plans";
import { resetStudents } from "./database/students";
import { resetTeachers } from "./database/teachers";
import { resetTeacherScreenings } from "./database/teacherScreening";

export function resetMockData() {
  resetNotifications();
  resetTeachers();
  resetStudents();
  resetTeacherScreenings();
  resetPlans();
  resetEvaluations();
  resetParents();
}
