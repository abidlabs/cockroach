// Copyright 2020 The Cockroach Authors.
//
// Use of this software is governed by the Business Source License
// included in the file licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with
// the Business Source License, use of this software will be governed
// by the Apache License, Version 2.0, included in the file
// licenses/APL.txt.

import React, { forwardRef, useState, useCallback, useImperativeHandle } from "react";
import { connect } from "react-redux";
import { Action, Dispatch } from "redux";

import { Anchor, Modal, Text } from "src/components";
import { createStatementDiagnosticsReportAction } from "src/redux/statements";
import { AdminUIState } from "src/redux/state";
import { invalidateStatementDiagnosticsRequests, refreshStatementDiagnosticsRequests } from "src/redux/apiReducers";
import { statementDiagnostics } from "src/util/docs";
import { AggregateStatistics } from "../statementsTable";
import { analytics } from "src/redux/analytics";

export type ActivateDiagnosticsModalProps = MapDispatchToProps;

function trackActivateDiagnostics (statement: AggregateStatistics) {
  analytics.track({
    event: "Diagnostics Activation",
    properties: {
      fingerprint: statement.label,
    },
  });
}

export interface ActivateDiagnosticsModalRef {
  showModalFor: (statement: AggregateStatistics) => void;
}

// tslint:disable-next-line:variable-name
const ActivateDiagnosticsModal = (props: ActivateDiagnosticsModalProps, ref: React.RefObject<ActivateDiagnosticsModalRef>) => {
  const {activate} = props;
  const [visible, setVisible] = useState(false);
  const [statement, setStatement] = useState<string>();

  const onOkHandler = useCallback(
    () => {
      activate(statement);
      setVisible(false);
    },
    [statement],
  );

  const onCancelHandler = useCallback(() => setVisible(false), []);

  useImperativeHandle(ref, () => {
    return {
      showModalFor: (forwardStatement: AggregateStatistics) => {
        setStatement(forwardStatement.label);
        trackActivateDiagnostics(forwardStatement);
        setVisible(true);
      },
    };
  });

  return (
    <Modal
      visible={visible}
      onOk={onOkHandler}
      onCancel={onCancelHandler}
      okText="Activate"
      cancelText="Cancel"
      title="Activate statement diagnostics"
    >
      <Text>
        When you activate statement diagnostics, CockroachDB will wait for the next query that matches this statement
        fingerprint.
      </Text>
      <p/>
      <Text>
        A download button will appear on the statement list and detail pages when the query is ready.
        The download will include EXPLAIN plans, table statistics, and traces. <Anchor href={statementDiagnostics}>Learn more</Anchor>
      </Text>
    </Modal>
  );
};

interface MapDispatchToProps {
  activate: (statement: string) => void;
  refreshDiagnosticsReports: () => void;
}

const mapDispatchToProps = (dispatch: Dispatch<Action, AdminUIState>): MapDispatchToProps => ({
  activate: (statement: string) => dispatch(createStatementDiagnosticsReportAction(statement)),
  refreshDiagnosticsReports: () => {
    dispatch(invalidateStatementDiagnosticsRequests());
    dispatch(refreshStatementDiagnosticsRequests());
  },
});

export default connect<null, MapDispatchToProps>(
  null,
  mapDispatchToProps,
  null,
  {forwardRef: true},
)(forwardRef(ActivateDiagnosticsModal));
