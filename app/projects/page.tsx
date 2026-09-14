import { ProjectsPageClient } from "@/components/projects/projects-page-client";
import { projectMocks } from "@/lib/mock-projects";

export default function ProjectsPage() {
  return <ProjectsPageClient initialProjects={projectMocks} />;
}