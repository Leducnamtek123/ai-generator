import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";

export default async function WorkflowPage(props: {
    searchParams: Promise<{ projectId?: string; templateId?: string; workflowId?: string }>;
}) {
    const searchParams = await props.searchParams;
    const { projectId, templateId, workflowId } = searchParams;

    return (
        <div className="h-full w-full">
            <WorkflowCanvas projectId={projectId} templateId={templateId} workflowId={workflowId} />
        </div>
    );
}
