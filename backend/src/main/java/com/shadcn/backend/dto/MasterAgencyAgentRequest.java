package com.shadcn.backend.dto;

import java.time.LocalDate;
import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonAlias;

public class MasterAgencyAgentRequest {

    @JsonAlias({"company_name", "companyName"})
    private String companyName;

    @JsonAlias({"agent_code", "agentCode"})
    private String agentCode;

    @JsonAlias({"full_name", "fullName"})
    private String fullName;

    @JsonAlias({"short_name", "shortName"})
    private String shortName;

    @JsonAlias({"birthday"})
    private LocalDate birthday;

    @JsonAlias({"gender"})
    private String gender;

    @JsonAlias({"gender_title", "genderTitle"})
    private String genderTitle;

    @JsonAlias({"phone_no", "phoneNo"})
    private String phoneNo;

    @JsonAlias({"rank_code", "rankCode"})
    private String rankCode;

    @JsonAlias({"rank_title", "rankTitle"})
    private String rankTitle;

    @JsonAlias({"appointment_date", "appointmentDate"})
    private LocalDate appointmentDate;

    @JsonAlias({"is_active", "isActive"})
    private Boolean isActive;

    public MasterAgencyAgentRequest() {
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getAgentCode() {
        return agentCode;
    }

    public void setAgentCode(String agentCode) {
        this.agentCode = agentCode;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getShortName() {
        return shortName;
    }

    public void setShortName(String shortName) {
        this.shortName = shortName;
    }

    public LocalDate getBirthday() {
        return birthday;
    }

    public void setBirthday(LocalDate birthday) {
        this.birthday = birthday;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getGenderTitle() {
        return genderTitle;
    }

    public void setGenderTitle(String genderTitle) {
        this.genderTitle = genderTitle;
    }

    public String getPhoneNo() {
        return phoneNo;
    }

    public void setPhoneNo(String phoneNo) {
        this.phoneNo = phoneNo;
    }

    public String getRankCode() {
        return rankCode;
    }

    public void setRankCode(String rankCode) {
        this.rankCode = rankCode;
    }

    public String getRankTitle() {
        return rankTitle;
    }

    public void setRankTitle(String rankTitle) {
        this.rankTitle = rankTitle;
    }

    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }

    @Override
    public String toString() {
        return "MasterAgencyAgentRequest{" +
                "companyName='" + companyName + '\'' +
                "agentCode='" + agentCode + '\'' +
                "fullName='" + fullName + '\'' +
                ", shortName='" + shortName + '\'' +
                ", birthday=" + birthday +
                ", gender='" + gender + '\'' +
                ", genderTitle='" + genderTitle + '\'' +
                ", phoneNo='" + phoneNo + '\'' +
                ", rankCode='" + rankCode + '\'' +
                ", rankTitle='" + rankTitle + '\'' +
                ", appointmentDate=" + appointmentDate +
                ", isActive=" + isActive +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MasterAgencyAgentRequest that = (MasterAgencyAgentRequest) o;
        return Objects.equals(companyName, that.companyName) && Objects.equals(agentCode, that.agentCode) && Objects.equals(fullName, that.fullName) && Objects.equals(shortName, that.shortName) && Objects.equals(birthday, that.birthday) && Objects.equals(gender, that.gender) && Objects.equals(genderTitle, that.genderTitle) && Objects.equals(phoneNo, that.phoneNo) && Objects.equals(rankCode, that.rankCode) && Objects.equals(rankTitle, that.rankTitle) && Objects.equals(appointmentDate, that.appointmentDate) && Objects.equals(isActive, that.isActive);
    }

    @Override
    public int hashCode() {
        return Objects.hash(companyName, agentCode, fullName, shortName, birthday, gender, genderTitle, phoneNo, rankCode, rankTitle, appointmentDate, isActive);
    }
}
