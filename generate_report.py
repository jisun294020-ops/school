#!/usr/bin/env python3
"""
학교별 심리검사 해석 보고서 생성기

지원 검사:
  - 정서행동특성검사
  - 학습심리검사
  - 다면적 인성검사 (MMPI)

사용법:
  python generate_report.py                          # 모든 학교 보고서 생성
  python generate_report.py --school 한빛초등학교     # 특정 학교 보고서 생성
  python generate_report.py --list                   # 등록된 학교 목록 확인
"""

import json
import os
import argparse
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
CRITERIA_DIR = DATA_DIR / "criteria"
SCHOOLS_DIR = DATA_DIR / "schools"
REPORTS_DIR = BASE_DIR / "reports"


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_criteria():
    """해석 기준 데이터를 모두 로드한다."""
    criteria = {}
    for file in CRITERIA_DIR.glob("*.json"):
        data = load_json(file)
        criteria[file.stem] = data
    return criteria


def load_school_data(school_name=None):
    """학교 데이터를 로드한다. school_name이 None이면 모든 학교를 로드한다."""
    schools = {}
    for file in sorted(SCHOOLS_DIR.glob("*.json")):
        data = load_json(file)
        name = data.get("school_name", file.stem)
        if school_name is None or name == school_name:
            schools[name] = data
    return schools


def interpret_emotional_behavioral(school_data, criteria):
    """정서행동특성검사 결과를 해석한다."""
    test_data = school_data.get("emotional_behavioral")
    if not test_data:
        return None

    lines = []
    lines.append("## 정서행동특성검사 결과 해석\n")

    # 선별 결과 요약
    screening = test_data.get("screening", {})
    total = screening.get("total_students", 0)
    normal = screening.get("normal", 0)
    concern = screening.get("concern", 0)

    lines.append(f"### 1차 선별 결과")
    lines.append(f"- 전체 검사 인원: {total}명")
    lines.append(f"- 정상군: {normal}명 ({normal/total*100:.1f}%)" if total > 0 else "- 정상군: 0명")
    lines.append(f"- 관심군: {concern}명 ({concern/total*100:.1f}%)" if total > 0 else "- 관심군: 0명")
    lines.append("")

    # 2차 선별 결과
    secondary = test_data.get("secondary_screening", {})
    if secondary:
        general = secondary.get("general_management", 0)
        priority = secondary.get("priority_management", 0)
        lines.append(f"### 2차 선별 결과")
        lines.append(f"- 일반관리군: {general}명")
        lines.append(f"- 우선관리군: {priority}명")
        lines.append("")

    # 영역별 해석
    domain_scores = test_data.get("domain_scores", {})
    if domain_scores:
        lines.append("### 영역별 분석")
        for domain_info in criteria.get("domains", []):
            domain_name = domain_info["name"]
            score = domain_scores.get(domain_name)
            if score is not None:
                level = "높음" if score >= 70 else "보통" if score >= 40 else "낮음"
                interp = domain_info["high_score_interpretation"] if score >= 70 else domain_info["low_score_interpretation"]
                lines.append(f"- **{domain_name}** (평균 T점수: {score}): {level}")
                lines.append(f"  - 해석: {interp}")
        lines.append("")

    # 해석 기준 안내
    screening_levels = criteria.get("screening_levels", {})
    for level_key, level_data in screening_levels.items():
        lines.append(f"### {level_key} 기준 안내")
        for cat_key, cat_data in level_data.get("categories", {}).items():
            lines.append(f"- **{cat_data['label']}**: {cat_data['interpretation']}")
            lines.append(f"  - 후속 조치: {cat_data['follow_up']}")
        lines.append("")

    return "\n".join(lines)


def interpret_learning_psychology(school_data, criteria):
    """학습심리검사 결과를 해석한다."""
    test_data = school_data.get("learning_psychology")
    if not test_data:
        return None

    lines = []
    lines.append("## 학습심리검사 결과 해석\n")

    total = test_data.get("total_students", 0)
    lines.append(f"- 전체 검사 인원: {total}명\n")

    # 영역별 해석
    domain_results = test_data.get("domain_results", {})
    for domain_info in criteria.get("domains", []):
        domain_name = domain_info["name"]
        result = domain_results.get(domain_name)
        if result is None:
            continue

        lines.append(f"### {domain_name}")

        # 분포
        dist = result.get("distribution", {})
        if dist:
            lines.append(f"- 상: {dist.get('상', 0)}명 / 중: {dist.get('중', 0)}명 / 하: {dist.get('하', 0)}명")

        # 평균 수준에 따른 해석
        avg_level = result.get("average_level", "중")
        level_info = domain_info["levels"].get(avg_level, {})
        if level_info:
            lines.append(f"- 학교 평균 수준: **{avg_level}** ({level_info.get('score_range', '')})")
            lines.append(f"- 해석: {level_info.get('interpretation', '')}")
            lines.append(f"- 지도 방향: {level_info.get('guidance', '')}")
        lines.append("")

    return "\n".join(lines)


def interpret_multiphasic_personality(school_data, criteria):
    """다면적 인성검사(MMPI) 결과를 해석한다."""
    test_data = school_data.get("multiphasic_personality")
    if not test_data:
        return None

    lines = []
    lines.append("## 다면적 인성검사 결과 해석\n")

    total = test_data.get("total_students", 0)
    lines.append(f"- 전체 검사 인원: {total}명\n")

    # 타당도 척도
    validity = test_data.get("validity_scales", {})
    if validity:
        lines.append("### 타당도척도 분석")
        for scale_info in criteria.get("validity_scales", [{}])[0].get("sub_scales", []):
            code = scale_info["code"]
            score = validity.get(code)
            if score is not None:
                is_high = score > 65
                interp = scale_info["high_interpretation"] if is_high else scale_info["normal_interpretation"]
                lines.append(f"- **{scale_info['name']}({code})** 평균 T점수: {score} → {interp}")
        lines.append("")

    # 임상 척도
    clinical = test_data.get("clinical_scales", {})
    if clinical:
        lines.append("### 임상척도 분석")

        # T점수 해석 기준
        t_score_guide = criteria.get("score_interpretation", {}).get("T_score", {})

        for scale_info in criteria.get("clinical_scales", []):
            code = scale_info["code"]
            score = clinical.get(code)
            if score is None:
                continue

            # T점수 수준 판별
            if score > 75:
                level = "매우 높음"
            elif score > 65:
                level = "높음"
            elif score > 55:
                level = "약간 높음"
            elif score >= 45:
                level = "보통"
            elif score >= 35:
                level = "낮음"
            else:
                level = "매우 낮음"

            lines.append(f"- **{scale_info['name']}({code})** 평균 T점수: {score} ({level})")
            if score > 55:
                lines.append(f"  - 해석: {scale_info['high_interpretation']}")
                lines.append(f"  - 지도 방향: {scale_info['guidance']}")
        lines.append("")

    # 주의 필요 학생 비율
    alert = test_data.get("alert_students", {})
    if alert:
        lines.append("### 주의 필요 학생 현황")
        for scale_name, count in alert.items():
            lines.append(f"- {scale_name} 주의군: {count}명")
        lines.append("")

    return "\n".join(lines)


def generate_report(school_name, school_data, criteria):
    """학교별 종합 해석 보고서를 생성한다."""
    lines = []
    lines.append(f"# {school_name} 심리검사 해석 보고서\n")
    lines.append(f"- 작성일: {datetime.now().strftime('%Y-%m-%d')}")
    lines.append(f"- 학교명: {school_name}")
    lines.append(f"- 학년: {school_data.get('grade', '전체')}")
    lines.append(f"- 검사 실시일: {school_data.get('test_date', '미기재')}")
    lines.append("")
    lines.append("---\n")

    # 각 검사별 해석
    eb = interpret_emotional_behavioral(school_data, criteria.get("emotional_behavioral", {}))
    if eb:
        lines.append(eb)
        lines.append("---\n")

    lp = interpret_learning_psychology(school_data, criteria.get("learning_psychology", {}))
    if lp:
        lines.append(lp)
        lines.append("---\n")

    mp = interpret_multiphasic_personality(school_data, criteria.get("multiphasic_personality", {}))
    if mp:
        lines.append(mp)
        lines.append("---\n")

    # 종합 의견
    lines.append("## 종합 의견 및 권장 사항\n")
    recommendations = school_data.get("recommendations", [])
    if recommendations:
        for rec in recommendations:
            lines.append(f"- {rec}")
    else:
        lines.append("- (학교별 종합 의견을 입력해 주세요)")
    lines.append("")

    return "\n".join(lines)


def list_schools():
    """등록된 학교 목록을 출력한다."""
    if not SCHOOLS_DIR.exists():
        print("등록된 학교가 없습니다.")
        return

    schools = sorted(SCHOOLS_DIR.glob("*.json"))
    if not schools:
        print("등록된 학교가 없습니다.")
        return

    print("=== 등록된 학교 목록 ===")
    for f in schools:
        data = load_json(f)
        print(f"  - {data.get('school_name', f.stem)} ({f.name})")


def main():
    parser = argparse.ArgumentParser(description="학교별 심리검사 해석 보고서 생성기")
    parser.add_argument("--school", type=str, help="특정 학교명 지정 (미지정 시 전체 생성)")
    parser.add_argument("--list", action="store_true", help="등록된 학교 목록 확인")
    parser.add_argument("--output", type=str, default=None, help="출력 디렉토리 지정")
    args = parser.parse_args()

    if args.list:
        list_schools()
        return

    # 해석 기준 로드
    criteria = load_criteria()

    # 학교 데이터 로드
    schools = load_school_data(args.school)
    if not schools:
        if args.school:
            print(f"'{args.school}' 학교 데이터를 찾을 수 없습니다.")
        else:
            print("등록된 학교 데이터가 없습니다. data/schools/ 디렉토리에 JSON 파일을 추가해 주세요.")
        return

    # 출력 디렉토리
    output_dir = Path(args.output) if args.output else REPORTS_DIR
    output_dir.mkdir(parents=True, exist_ok=True)

    # 보고서 생성
    for school_name, school_data in schools.items():
        report = generate_report(school_name, school_data, criteria)
        safe_name = school_name.replace(" ", "_")
        output_path = output_dir / f"{safe_name}_해석보고서.md"
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(report)
        print(f"[완료] {school_name} → {output_path}")


if __name__ == "__main__":
    main()
