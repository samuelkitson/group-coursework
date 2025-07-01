import { useAuthStore } from "@/store/authStore";
import React from "react";
import { Link } from "react-router-dom";
import { Card } from "react-bootstrap";

function Help() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div>
      <h1>Help & Support</h1>
      <p>
        This is a tool to support staff and students in managing group
        coursework assignments at university. This is version 2.0.
      </p>
      {!isAuthenticated && (
        <p>
          You'll need to <Link to="/login">log in</Link> to see your
          assignments.
        </p>
      )}
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Text>
            <p className="mb-2">
              This demo version doesn't have built-in help guides.
            </p>
            <p className="mb-1 text-muted">
              Imagine that there are some really fancy, nicely designed guides
              here. Maybe some pictures and diagrams too if you're lucky.
            </p>
          </Card.Text>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Help;
