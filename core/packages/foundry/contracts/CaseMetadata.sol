// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

enum IPStatus {
    DetectionMonitoring,
    PatentStrengthAnalysis,
    InfringementAnalysis,
    DamagesQuantification,
    DefendantDueDiligence,
    StrategyDecision,
    CeaseAndDesistFormalNotice,
    SettlementLicensingNegotiationPreSuit,
    StatementOfClaimFiling,
    ServiceOfProcess,
    PreliminaryObjections,
    StatementOfDefence,
    ReplyRejoinderCycle,
    ClosureOfWrittenProcedure,
    InterimProcedureCaseManagement,
    OralProcedureHearing,
    FirstInstanceDecision,
    ProvisionalMeasuresPITrack,
    AppealCourtOfAppealLuxembourg,
    DamagesAssessmentSeparateProceedings,
    EnforcementOfJudgment,
    SettlementExecution
}

/// @title Metadata
/// @notice Dynamic case metadata for a license (campaign) token.
struct Metadata {
    IPStatus status;
    uint256 statusUpdateTimestamp;
    string statusUpdateExplanation;
}
