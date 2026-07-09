import type {
  ApiNode,
  Environment,
  HeaderSet,
  SavedBody,
  Workflow,
} from "@/lib/types";

/**
 * Demo data for a first-time user: a 3-node chain against the local
 * /api/echo endpoint that demonstrates response chaining end to end.
 */
export function seedDemo(): {
  workflow: Workflow;
  savedBodies: SavedBody[];
  headerSets: HeaderSet[];
  environments: Environment[];
} {
  const uid = () => crypto.randomUUID();

  const environment: Environment = {
    id: uid(),
    name: "Local",
    vars: [
      { key: "BASE_URL", value: window.location.origin, enabled: true },
      { key: "API_KEY", value: "demo-key-123", enabled: true },
    ],
  };

  const headerSet: HeaderSet = {
    id: uid(),
    name: "JSON + auth",
    headers: [
      { key: "Content-Type", value: "application/json", enabled: true },
      { key: "X-Api-Key", value: "{{env.API_KEY}}", enabled: true },
    ],
  };

  const savedBody: SavedBody = {
    id: uid(),
    name: "New customer",
    json: JSON.stringify(
      { customerId: "c_123", name: "Ada Lovelace", country: "IN" },
      null,
      2,
    ),
  };

  const base = {
    type: "api" as const,
    headers: [],
  };

  const nodes: ApiNode[] = [
    {
      ...base,
      id: uid(),
      position: { x: 80, y: 260 },
      data: {
        label: "Create Customer",
        method: "POST",
        url: "{{env.BASE_URL}}/api/echo",
        headerSetId: headerSet.id,
        headers: [],
        bodyMode: "saved",
        savedBodyId: savedBody.id,
        inlineBody: "",
      },
    },
    {
      ...base,
      id: uid(),
      position: { x: 80, y: 470 },
      data: {
        label: "Share KYC",
        method: "POST",
        url: "{{env.BASE_URL}}/api/echo",
        headerSetId: headerSet.id,
        headers: [],
        bodyMode: "inline",
        inlineBody: JSON.stringify(
          {
            customerId: "{{nodes.Create Customer.response.body.data.customerId}}",
            document: "PAN",
            status: "approved",
          },
          null,
          2,
        ),
      },
    },
    {
      ...base,
      id: uid(),
      position: { x: 80, y: 680 },
      data: {
        label: "Create Payout",
        method: "POST",
        url: "{{env.BASE_URL}}/api/echo",
        headerSetId: headerSet.id,
        headers: [],
        bodyMode: "inline",
        inlineBody: JSON.stringify(
          {
            customerId: "{{nodes.Share KYC.response.body.data.customerId}}",
            kycStatus: "{{nodes.Share KYC.response.body.data.status}}",
            amountUsd: 250,
          },
          null,
          2,
        ),
      },
    },
  ];

  const workflow: Workflow = {
    id: uid(),
    name: "Demo: payout flow",
    nodes,
    edges: [
      {
        id: uid(),
        source: nodes[0].id,
        target: nodes[1].id,
        type: "smoothstep",
      },
      {
        id: uid(),
        source: nodes[1].id,
        target: nodes[2].id,
        type: "smoothstep",
      },
    ],
  };

  return {
    workflow,
    savedBodies: [savedBody],
    headerSets: [headerSet],
    environments: [environment],
  };
}
