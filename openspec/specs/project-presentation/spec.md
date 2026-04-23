## Purpose

Defines GitHub Pages, public documentation IA, and GitHub repository metadata requirements for accurately presenting the project.

## Requirements

### Requirement: GitHub Pages presents the project instead of mirroring README
The GitHub Pages site SHALL explain the project's value, architecture, usage path, and documentation entry points as a purpose-built project site.

#### Scenario: Landing page introduces the project clearly
- **WHEN** a visitor opens the GitHub Pages home page
- **THEN** the page SHALL explain what the project does, who it is for, and how to try it
- **AND** it SHALL direct visitors to the most relevant docs and specifications without acting as a README duplicate

#### Scenario: Project capabilities are presented accurately
- **WHEN** the site highlights features or architecture
- **THEN** the content SHALL reflect the actual implemented stack and capabilities
- **AND** unsupported claims or outdated references SHALL not remain

### Requirement: Public documentation navigation is coherent
The published documentation SHALL use a clear information architecture for overview, setup, architecture/specs, and reference material.

#### Scenario: Navigation routes to live content only
- **WHEN** a visitor uses site navigation or internal links
- **THEN** the destination SHALL resolve to live pages and current `openspec/` content
- **AND** stale paths such as deleted `/specs/` routes SHALL not remain

#### Scenario: Documentation layers are separated
- **WHEN** public documentation is organized
- **THEN** overview and quickstart content SHALL be separated from deep technical reference and specification content
- **AND** redundant pages that add no new value SHALL be removed or consolidated

### Requirement: GitHub repository metadata matches the actual project
The GitHub repository description, homepage, and topics SHALL accurately represent the current implementation and public project site.

#### Scenario: Homepage URL is configured
- **WHEN** repository metadata is updated
- **THEN** the homepage URL SHALL point to the project's GitHub Pages site or other chosen canonical landing page
- **AND** public metadata SHALL remain consistent with that destination

#### Scenario: Topics are curated for accuracy
- **WHEN** repository topics are configured
- **THEN** they SHALL describe technologies and capabilities that the project actually uses
- **AND** misleading topics for unsupported architectures, libraries, or product directions SHALL be removed

### Requirement: Public messaging stays aligned with closeout goals
The project's public-facing content SHALL emphasize stable capabilities and learning value without exposing internal maintenance or archive planning.

#### Scenario: Closeout intent stays internal
- **WHEN** README, Pages, or repository metadata are revised
- **THEN** they SHALL present the project as a polished stable artifact
- **AND** they SHALL not disclose private maintainer intent to reduce future development activity

#### Scenario: Bilingual public surfaces stay consistent
- **WHEN** English and Simplified Chinese public pages are both retained
- **THEN** their key links, claims, and entry points SHALL remain aligned in meaning and scope
- **AND** one language SHALL not point to stale content that the other language has already replaced
